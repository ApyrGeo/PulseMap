using OpenAI.Chat;
using PulseMap.Interfaces;
using System.ClientModel;

namespace PulseMap.Service.AI.LocationMatch;

public class GptLocationMatcher : ILocationMatcher
{
    private readonly ChatClient _chatClient;
    private readonly ILogger<GptLocationMatcher> _logger;
    private readonly IAIStatisticsService _statisticsService;
    private readonly ITranslationService _translationService;

    public GptLocationMatcher(
        IConfiguration config, 
        ILogger<GptLocationMatcher> logger,
        IAIStatisticsService statisticsService,
        ITranslationService translationService)
    {
        _logger = logger;
        _statisticsService = statisticsService;
        _translationService = translationService;

        var apiKey = config["OpenAI:ApiKey"];
        var model = config["OpenAI:Model"] ?? "gpt-3.5-turbo";

        if (string.IsNullOrEmpty(apiKey))
        {
            var errorMsg = "OpenAI ApiKey is missing in configuration - GptLocationMatcher will not work";
            _logger.LogWarning(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }

        _logger.LogInformation("Initializing GPT Location Matcher with Model: {Model}", model);

        _chatClient = new ChatClient(model, new ApiKeyCredential(apiKey));
    }

    public async Task<LocationMatchResult> MatchLocationsAsync(string description1, string description2, CancellationToken ct)
    {
        _logger.LogInformation("Matching locations using GPT: '{Desc1}' vs '{Desc2}'", description1, description2);

        var englishDesc1 = await _translationService.TranslateToEnglishIfNeededAsync(description1, ct);
        var englishDesc2 = await _translationService.TranslateToEnglishIfNeededAsync(description2, ct);

        var systemPrompt = """
You are a location matching assistant.

Given two descriptions of locations, determine if they refer to the SAME location.

Rules:
- Return only "Same location" or "Different location" or "Possibly same location".
- If uncertain but close, return "Possibly same location".
- Do not explain.
""";

        var userPrompt = $"""
Description 1: "{englishDesc1}"
Description 2: "{englishDesc2}"
""";

        var messages = new List<ChatMessage>
        {
            new SystemChatMessage(systemPrompt),
            new UserChatMessage(userPrompt)
        };

        var options = new ChatCompletionOptions
        {
            Temperature = 0.1f,
            MaxOutputTokenCount = 20
        };

        var response = await _chatClient.CompleteChatAsync(messages, options, ct);
        var result = response.Value.Content[0].Text.Trim().ToLowerInvariant();

        _logger.LogInformation("GPT returned: {Result}", result);

        LocationMatchResult matchResult;
        
        if (result.Contains("same location") && !result.Contains("possibly"))
        {
            _logger.LogInformation("HIGH confidence: Same location");
            matchResult = LocationMatchResult.SameLocation;
        }
        else if (result.Contains("possibly"))
        {
            _logger.LogInformation("MEDIUM confidence: Possibly same location");
            matchResult = LocationMatchResult.PossiblySameLocation;
        }
        else
        {
            _logger.LogInformation("Different location");
            matchResult = LocationMatchResult.DifferentLocation;
        }

        if (matchResult == LocationMatchResult.SameLocation || matchResult == LocationMatchResult.PossiblySameLocation)
        {
            await _statisticsService.IncrementGptMatcherAsync();
        }

        return matchResult;
    }
}
