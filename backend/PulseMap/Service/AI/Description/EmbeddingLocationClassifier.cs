using PulseMap.Interfaces;
using OpenAI.Embeddings;

namespace PulseMap.Service.AI.Description;

public class EmbeddingLocationClassifier : ILocationClassifier
{
    private readonly EmbeddingClient _embeddingClient;
    private readonly ILogger<EmbeddingLocationClassifier> _logger;
    private readonly IAIStatisticsService _statisticsService;
    private readonly ICategoryRepository _categoryRepository;

    public EmbeddingLocationClassifier(
        IConfiguration config, 
        ILogger<EmbeddingLocationClassifier> logger,
        IAIStatisticsService statisticsService,
        ICategoryRepository categoryRepository)
    {
        _logger = logger;
        _statisticsService = statisticsService;
        _categoryRepository = categoryRepository;

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
            var categories = await _categoryRepository.GetCategoriesAsync(true);
            var categoryDescriptions = categories
                .Where(c => !string.Equals(c.Name, "Not Set", StringComparison.OrdinalIgnoreCase))
                .Select(c => c.Name)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    name => name,
                    name => BuildCategoryDescription(name));

            if (categoryDescriptions.Count == 0)
            {
                throw new InvalidOperationException("No active categories configured in DB for classification");
            }

            var descriptionEmbeddingResponse = await _embeddingClient.GenerateEmbeddingAsync(description, cancellationToken: ct);
            var descriptionEmbedding = descriptionEmbeddingResponse.Value.ToFloats();
            
            var categoryScores = new Dictionary<string, double>();
            
            foreach (var (category, categoryDesc) in categoryDescriptions)
            {
                var categoryEmbeddingResponse = await _embeddingClient.GenerateEmbeddingAsync(categoryDesc, cancellationToken: ct);
                var categoryEmbedding = categoryEmbeddingResponse.Value.ToFloats();
                
                var similarity = CosineSimilarity(descriptionEmbedding.Span, categoryEmbedding.Span);
                categoryScores[category] = similarity;
                _logger.LogDebug("Category {Category} similarity: {Similarity:F4}", category, similarity);
            }
            
            var topCategories = categoryScores
                .OrderByDescending(kvp => kvp.Value)
                .Where(kvp => kvp.Value >= 0.25)
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

    private static readonly Dictionary<string, string> CategoryDescriptions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Music"]         = "music concert live performance band DJ festival show stage singer musician gig venue sound",
        ["Sport"]         = "sport fitness gym workout training match football basketball tennis swimming run marathon stadium",
        ["Food"]          = "food restaurant cafe bistro dining eat meal cuisine bar drink brunch lunch dinner snack",
        ["Entertainment"] = "entertainment cinema movie theater comedy show event party festival attraction amusement leisure fun",
        ["Education"]     = "education school university library lecture workshop seminar museum exhibit learning study class",
        ["Health"]        = "health clinic pharmacy hospital wellness medical doctor therapy meditation yoga spa wellness",
        ["Technology"]    = "technology hackathon startup coworking office tech meetup conference coding programming innovation",
        ["Travel"]        = "travel tourism landmark monument attraction sightseeing historic viewpoint scenic outdoor hiking",
        ["Art"]           = "art gallery exhibition street art mural painting sculpture craft design creative installation",
        ["Business"]      = "business market fair trade shop store retail commercial networking professional meeting",
    };

    private static string BuildCategoryDescription(string categoryName)
    {
        if (CategoryDescriptions.TryGetValue(categoryName, out var desc))
            return desc;
        return $"{categoryName} place event activity point of interest";
    }
}
