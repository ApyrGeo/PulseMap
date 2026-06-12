using OpenAI.Chat;
using PulseMap.Interfaces;
using System.ClientModel;

namespace PulseMap.Service.AI.Description;

public class OpenAiLocationClassifier : ILocationClassifier
{
    private readonly ChatClient _chatClient;
    private readonly ILogger<OpenAiLocationClassifier> _logger;
    private readonly IAIStatisticsService _statisticsService;
    private readonly ITranslationService _translationService;
    private readonly ICategoryRepository _categoryRepository;

    public OpenAiLocationClassifier(
        IConfiguration config, 
        ILogger<OpenAiLocationClassifier> logger,
        IAIStatisticsService statisticsService,
        ITranslationService translationService,
        ICategoryRepository categoryRepository)
    {
        _logger = logger;
        _statisticsService = statisticsService;
        _translationService = translationService;
        _categoryRepository = categoryRepository;

        var apiKey = config["OpenAI:ApiKey"];
        var model = config["OpenAI:Model"] ?? "gpt-3.5-turbo";

        if (string.IsNullOrEmpty(apiKey))
        {
            var errorMsg = "OpenAI ApiKey is missing in configuration - OpenAiLocationClassifier will not work";
            _logger.LogWarning(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }

        _logger.LogInformation("Initializing OpenAI with Model: {Model}", model);

        _chatClient = new ChatClient(model, new ApiKeyCredential(apiKey));
    }

    public async Task<List<string>> ClassifyLocationAsync(string description, CancellationToken ct)
    {
        _logger.LogInformation("Classifying location with description: {Description}", description);

        var categories = await GetAllowedCategoriesAsync();
        if (categories.Count == 0)
        {
            throw new InvalidOperationException("No active categories configured in DB for classification");
        }

        var englishDescription = await _translationService.TranslateToEnglishIfNeededAsync(description, ct);

        var systemPrompt = $"""
You are a classification system.
Your task is to classify a location description into the TOP 3 most relevant categories.

Allowed categories:
{string.Join(", ", categories)}

Rules:
- Return EXACTLY 3 category names separated by commas
- Order them by relevance (most relevant first)
- Only use categories from the allowed list
- Format: "Category1, Category2, Category3"
- No explanations, no extra text
""";

        var messages = new List<ChatMessage>
        {
            new SystemChatMessage(systemPrompt),
            new UserChatMessage(englishDescription)
        };

        var options = new ChatCompletionOptions
        {
            Temperature = 0.3f,
            MaxOutputTokenCount = 30
        };

        var response = await _chatClient.CompleteChatAsync(
            messages,
            options,
            ct
        );

        var result = response.Value.Content[0].Text.Trim();
        _logger.LogInformation("AI returned categories: {Categories}", result);

        var returnedCategories = result
            .Split(',')
            .Select(c => c.Trim())
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .ToList();

        var validCategories = returnedCategories
            .Where(cat => categories.Contains(cat, StringComparer.OrdinalIgnoreCase))
            .Select(cat => categories.First(c => c.Equals(cat, StringComparison.OrdinalIgnoreCase)))
            .Distinct()
            .Take(3)
            .ToList();

        if (validCategories.Count == 0)
        {
            _logger.LogWarning("AI returned no valid categories");
            throw new InvalidOperationException("OpenAI returned invalid categories");
        }

        while (validCategories.Count < 3 && validCategories.Count < categories.Count)
        {
            var nextCategory = categories.FirstOrDefault(c => !validCategories.Contains(c));
            if (nextCategory != null)
            {
                validCategories.Add(nextCategory);
            }
            else
            {
                break;
            }
        }

        _logger.LogInformation("Successfully classified as: {Categories}", string.Join(", ", validCategories));
        
        await _statisticsService.IncrementOpenAIClassifierAsync();
        
        return validCategories;
    }

    private async Task<List<string>> GetAllowedCategoriesAsync()
    {
        var dbCategories = await _categoryRepository.GetCategoriesAsync(true);
        return dbCategories
            .Where(c => !string.Equals(c.Name, "Not Set", StringComparison.OrdinalIgnoreCase))
            .Select(c => c.Name)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
