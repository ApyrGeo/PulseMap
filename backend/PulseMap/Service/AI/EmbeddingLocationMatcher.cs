using Azure;
using Azure.AI.OpenAI;
using OpenAI.Embeddings;
using PulseMap.Interfaces;

namespace PulseMap.Service.AI;

public class EmbeddingLocationMatcher : ILocationMatcher
{
    private readonly EmbeddingClient _embeddingClient;
    private readonly ILogger<EmbeddingLocationMatcher> _logger;

    public EmbeddingLocationMatcher(IConfiguration config, ILogger<EmbeddingLocationMatcher> logger)
    {
        _logger = logger;

        // Always use OpenAI direct for embeddings (simpler, no deployment needed)
        var apiKey = config["OpenAI:ApiKey"];
        var model = config["OpenAI:EmbeddingModel"] ?? "text-embedding-3-large";

        if (string.IsNullOrEmpty(apiKey))
        {
            var errorMsg = "OpenAI ApiKey is missing in configuration - EmbeddingLocationMatcher will not work";
            _logger.LogWarning(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }

        _logger.LogInformation("Initializing OpenAI Embedding client with model: {Model}", model);

        _embeddingClient = new EmbeddingClient(model, new System.ClientModel.ApiKeyCredential(apiKey));

        _logger.LogInformation("EmbeddingLocationMatcher initialized successfully");
    }

    public async Task<LocationMatchResult> MatchLocationsAsync(string description1, string description2, CancellationToken ct)
    {
        _logger.LogInformation("Matching locations using embeddings: '{Desc1}' vs '{Desc2}'", description1, description2);

        try
        {
            _logger.LogInformation("Generating embedding for description 1");
            var embedding1 = await _embeddingClient.GenerateEmbeddingAsync(description1, cancellationToken: ct);
            
            _logger.LogInformation("Generating embedding for description 2");
            var embedding2 = await _embeddingClient.GenerateEmbeddingAsync(description2, cancellationToken: ct);

            var vector1 = embedding1.Value.ToFloats();
            var vector2 = embedding2.Value.ToFloats();

            _logger.LogInformation("Calculating cosine similarity between vectors (size: {Size1} x {Size2})", 
                vector1.Length, vector2.Length);

            var similarity = CosineSimilarity(vector1, vector2);

            _logger.LogInformation("Cosine similarity: {Similarity:F4}", similarity);

            LocationMatchResult result;
            if (similarity > 0.80)
            {
                result = LocationMatchResult.SameLocation;
                _logger.LogInformation("HIGH confidence: Same location (similarity: {Similarity:F4})", similarity);
            }
            else if (similarity > 0.65)
            {
                result = LocationMatchResult.PossiblySameLocation;
                _logger.LogInformation("MEDIUM confidence: Possibly same location (similarity: {Similarity:F4})", similarity);
            }
            else
            {
                result = LocationMatchResult.DifferentLocation;
                _logger.LogInformation("LOW confidence: Different location (similarity: {Similarity:F4})", similarity);
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate embeddings or calculate similarity. Details: {Message}", ex.Message);
            throw; // Re-throw to let CompositeLocationMatcher handle it
        }
    }

    private static double CosineSimilarity(ReadOnlyMemory<float> a, ReadOnlyMemory<float> b)
    {
        var aSpan = a.Span;
        var bSpan = b.Span;

        double dot = 0.0, magA = 0.0, magB = 0.0;
        for (int i = 0; i < aSpan.Length; i++)
        {
            dot += aSpan[i] * bSpan[i];
            magA += aSpan[i] * aSpan[i];
            magB += bSpan[i] * bSpan[i];
        }

        return dot / (Math.Sqrt(magA) * Math.Sqrt(magB));
    }
}
