using PulseMap.Interfaces;
using OpenAI.Embeddings;

namespace PulseMap.Service.AI.Description;

public class EmbeddingLocationClassifier : ILocationClassifier
{
    private readonly EmbeddingClient _embeddingClient;
    private readonly ILogger<EmbeddingLocationClassifier> _logger;
    private readonly IAIStatisticsService _statisticsService;
    
    
    private static readonly Dictionary<string, string> CategoryDescriptions = new()
    {
        { "Music", "music concert festival live performance band singer" },
        { "Sport", "sport football tennis gym fitness exercise athletic game" },
        { "Food", "restaurant food cafe coffee pizza meal dining eating" },
        { "Entertainment", "entertainment movie cinema theater show performance fun" },
        { "Education", "education school university course learning teaching student" },
        { "Health", "health hospital medical doctor clinic medicine healthcare" },
        { "Technology", "technology computer software IT programming tech innovation" },
        { "Travel", "travel vacation tourism trip hotel journey adventure" },
        { "Art", "art museum gallery painting sculpture exhibition culture" },
        { "Business", "business conference meeting office work corporate professional" }
    };

    public EmbeddingLocationClassifier(
        IConfiguration config, 
        ILogger<EmbeddingLocationClassifier> logger,
        IAIStatisticsService statisticsService)
    {
        _logger = logger;
        _statisticsService = statisticsService;

        var apiKey = config["OpenAI:ApiKey"];
        var model = config["OpenAI:EmbeddingModel"] ?? "text-embedding-3-large";

        if (string.IsNullOrEmpty(apiKey))
        {
            var errorMsg = "OpenAI ApiKey is missing - EmbeddingLocationClassifier will not work";
            _logger.LogWarning(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }

        _logger.LogInformation("Initialized EmbeddingLocationClassifier with OpenAI embeddings model: {Model}", model);

        _embeddingClient = new EmbeddingClient(model, new System.ClientModel.ApiKeyCredential(apiKey));
    }

    public async Task<List<string>> ClassifyLocationAsync(string description, CancellationToken ct)
    {
        _logger.LogInformation("Classifying location with description: {Description}", description);

        try
        {
            // Get embedding for the description
            var descriptionEmbeddingResponse = await _embeddingClient.GenerateEmbeddingAsync(description, cancellationToken: ct);
            var descriptionEmbedding = descriptionEmbeddingResponse.Value.ToFloats();
            
            // Get embeddings for all category descriptions and calculate similarities
            var categoryScores = new Dictionary<string, double>();
            
            foreach (var (category, categoryDesc) in CategoryDescriptions)
            {
                var categoryEmbeddingResponse = await _embeddingClient.GenerateEmbeddingAsync(categoryDesc, cancellationToken: ct);
                var categoryEmbedding = categoryEmbeddingResponse.Value.ToFloats();
                
                var similarity = CosineSimilarity(descriptionEmbedding.Span, categoryEmbedding.Span);
                categoryScores[category] = similarity;
                _logger.LogDebug("Category {Category} similarity: {Similarity:F4}", category, similarity);
            }
            
            // Sort by similarity and take top 3
            var topCategories = categoryScores
                .OrderByDescending(kvp => kvp.Value)
                .Take(3)
                .Select(kvp => kvp.Key)
                .ToList();
            
            var topScores = categoryScores
                .OrderByDescending(kvp => kvp.Value)
                .Take(3)
                .Select(kvp => kvp.Value)
                .ToList();
            
            _logger.LogInformation("Successfully classified as: {Categories} with scores: {Scores}", 
                string.Join(", ", topCategories), 
                string.Join(", ", topScores.Select(s => s.ToString("F2"))));

   
            await _statisticsService.IncrementHuggingFaceClassifierAsync();

            return topCategories;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to classify using embeddings");
            throw;
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

        return dot / (Math.Sqrt(magA) * Math.Sqrt(magB));
    }
}
