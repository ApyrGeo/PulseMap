using PulseMap.Interfaces;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PulseMap.Service.AI;

public class HuggingFaceLocationClassifier : ILocationClassifier
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<HuggingFaceLocationClassifier> _logger;
    private const string ApiUrl = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";

    private static readonly string[] Categories =
    {
        "Music",
        "Sport",
        "Food",
        "Entertainment",
        "Education",
        "Health",
        "Technology",
        "Travel",
        "Art",
        "Business"
    };

    public HuggingFaceLocationClassifier(IHttpClientFactory httpClientFactory, IConfiguration config, ILogger<HuggingFaceLocationClassifier> logger)
    {
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient("HuggingFace");
        
        var apiKey = config["HuggingFace:ApiKey"];
        if (!string.IsNullOrEmpty(apiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
        }

        _logger.LogInformation("Initialized Hugging Face classifier with model: facebook/bart-large-mnli");
    }

    public async Task<List<string>> ClassifyLocationAsync(string description, CancellationToken ct)
    {
        _logger.LogInformation("Classifying location with description: {Description}", description);

        var payload = new
        {
            inputs = description,
            parameters = new
            {
                candidate_labels = Categories
            }
        };

        var jsonPayload = JsonSerializer.Serialize(payload);
        var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync(ApiUrl, content, ct);
        
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Hugging Face API error: {StatusCode} - {Error}", response.StatusCode, error);
            throw new HttpRequestException($"Hugging Face API returned {response.StatusCode}");
        }

        var resultJson = await response.Content.ReadAsStringAsync(ct);
        _logger.LogInformation("Hugging Face API response: {Response}", resultJson);

        var result = JsonSerializer.Deserialize<HuggingFaceResponse>(resultJson);

        if (result?.Labels == null || result.Labels.Count == 0)
        {
            _logger.LogWarning("No labels returned from Hugging Face API");
            throw new InvalidOperationException("Hugging Face returned empty response");
        }

        // Take top 3 categories
        var topCategories = result.Labels.Take(3).ToList();
        
        _logger.LogInformation("Successfully classified as: {Categories} with scores: {Scores}", 
            string.Join(", ", topCategories), 
            string.Join(", ", result.Scores.Take(3).Select(s => s.ToString("F2"))));

        return topCategories;
    }

    private class HuggingFaceResponse
    {
        [JsonPropertyName("labels")]
        public List<string> Labels { get; set; } = new();

        [JsonPropertyName("scores")]
        public List<double> Scores { get; set; } = new();
    }
}
