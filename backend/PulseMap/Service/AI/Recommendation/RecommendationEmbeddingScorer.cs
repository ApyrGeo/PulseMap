using OpenAI.Embeddings;
using PulseMap.Interfaces;
using System.ClientModel;

namespace PulseMap.Service.AI.Recommendation;

public class RecommendationEmbeddingScorer : IRecommendationAiScorer
{
    private readonly EmbeddingClient? _embeddingClient;
    private readonly ILogger<RecommendationEmbeddingScorer> _logger;

    public RecommendationEmbeddingScorer(IConfiguration config, ILogger<RecommendationEmbeddingScorer> logger)
    {
        _logger = logger;

        var apiKey = config["OpenAI:ApiKey"];
        var model = config["OpenAI:RecommendationEmbeddingModel"] ?? "text-embedding-3-small";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("OpenAI ApiKey missing - RecommendationEmbeddingScorer disabled");
            return;
        }

        _embeddingClient = new EmbeddingClient(model, new ApiKeyCredential(apiKey));
        _logger.LogInformation("RecommendationEmbeddingScorer initialized with model: {Model}", model);
    }

    public async Task<Dictionary<int, double>> ScoreCandidatesByProfileAsync(
        IReadOnlyList<string> likedDescriptions,
        IReadOnlyList<(int LocationId, string Description)> candidateDescriptions,
        CancellationToken ct = default)
    {
        var scores = new Dictionary<int, double>();

        if (_embeddingClient == null)
        {
            return scores;
        }

        var cleanLiked = likedDescriptions
            .Where(d => !string.IsNullOrWhiteSpace(d))
            .Select(d => d.Trim())
            .Distinct()
            .Take(30)
            .ToList();

        if (cleanLiked.Count == 0 || candidateDescriptions.Count == 0)
        {
            return scores;
        }

        try
        {
            // Build user profile as element-wise mean of individual description embeddings
            // (not a single embedding of concatenated text, which loses per-item signal)
            var likedEmbeddingTasks = cleanLiked
                .Select(d => _embeddingClient.GenerateEmbeddingAsync(d, cancellationToken: ct))
                .ToList();
            var likedEmbeddingResponses = await Task.WhenAll(likedEmbeddingTasks);
            var likedVectors = likedEmbeddingResponses
                .Select(r => r.Value.ToFloats())
                .ToList();

            int dim = likedVectors[0].Length;
            var profileArr = new double[dim];
            foreach (var vec in likedVectors)
                for (int i = 0; i < dim; i++)
                    profileArr[i] += vec.Span[i];
            for (int i = 0; i < dim; i++)
                profileArr[i] /= likedVectors.Count;

            var candidateTasks = candidateDescriptions
                .Where(c => !string.IsNullOrWhiteSpace(c.Description))
                .Select(async candidate =>
                {
                    var response = await _embeddingClient.GenerateEmbeddingAsync(candidate.Description, cancellationToken: ct);
                    var vector = response.Value.ToFloats();
                    var cosine = CosineSimilarity(profileArr, vector.Span);
                    var normalized = (cosine + 1.0) / 2.0;
                    return (candidate.LocationId, Score: normalized);
                })
                .ToList();

            var results = await Task.WhenAll(candidateTasks);

            foreach (var result in results)
            {
                scores[result.LocationId] = result.Score;
            }

            return scores;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI recommendation scoring failed - falling back to non-AI scoring");
            return scores;
        }
    }

    private static double CosineSimilarity(ReadOnlySpan<float> a, ReadOnlySpan<float> b)
    {
        if (a.Length != b.Length)
            throw new ArgumentException("Vectors must have the same length");

        double dot = 0.0, magA = 0.0, magB = 0.0;
        for (int i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }
        return (magA == 0 || magB == 0) ? 0 : dot / (Math.Sqrt(magA) * Math.Sqrt(magB));
    }

    private static double CosineSimilarity(double[] a, ReadOnlySpan<float> b)
    {
        if (a.Length != b.Length)
            throw new ArgumentException("Vectors must have the same length");

        double dot = 0.0, magA = 0.0, magB = 0.0;
        for (int i = 0; i < a.Length; i++)
        {
            dot += a[i] * b[i];
            magA += a[i] * a[i];
            magB += b[i] * b[i];
        }
        return (magA == 0 || magB == 0) ? 0 : dot / (Math.Sqrt(magA) * Math.Sqrt(magB));
    }
}
