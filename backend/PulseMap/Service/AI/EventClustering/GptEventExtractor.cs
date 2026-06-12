using OpenAI.Chat;
using PulseMap.Interfaces;
using System.ClientModel;

namespace PulseMap.Service.AI.EventClustering;

public class GptEventExtractor : IEventExtractorService
{
    private readonly ChatClient _chatClient;
    private readonly ILogger<GptEventExtractor> _logger;
    private readonly IAIStatisticsService _statisticsService;
    private readonly ITranslationService _translationService;

    public GptEventExtractor(
        IConfiguration config,
        ILogger<GptEventExtractor> logger,
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
            var errorMsg = "OpenAI ApiKey is missing - GptEventExtractor will not work";
            _logger.LogWarning(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }

        _chatClient = new ChatClient(model, new ApiKeyCredential(apiKey));
        _logger.LogInformation("GptEventExtractor initialized with model: {Model}", model);
    }

    public async Task<EventExtractionResult> ExtractEventNameAsync(string description, CancellationToken ct)
    {
        _logger.LogInformation("\n=== GPT Event Extraction ===");
        _logger.LogInformation("Extracting event name from description: {Description}", 
            description.Substring(0, Math.Min(100, description.Length)));

        var englishDescription = await _translationService.TranslateToEnglishIfNeededAsync(description, ct);

        var systemPrompt = """
You are an event name extraction system.
Your task is to identify if a location description mentions a specific event (festival, concert, protest, conference, etc.).

Rules:
1. If an event is mentioned, return ONLY the event name (e.g., "Untold", "TIFF", "Protest Piata Universitatii")
2. Return a confidence score from 0 to 1 (0.0 = no event, 1.0 = very clear event)
3. Format: "EventName|confidence" (e.g., "Untold|0.95" or "NONE|0.0")
4. Normalize event names (e.g., "Untold Festival 2025" → "Untold")
5. If no clear event is mentioned, return "NONE|0.0"

Examples:
- "Pizza stand at Untold" → "Untold|0.95"
- "Food truck near TIFF venue" → "TIFF|0.85"
- "Great burger place" → "NONE|0.0"
- "Concert in the park" → "NONE|0.2" (too vague)
""";

        var messages = new List<ChatMessage>
        {
            new SystemChatMessage(systemPrompt),
            new UserChatMessage(englishDescription)
        };

        var options = new ChatCompletionOptions
        {
            Temperature = 0.2f,
            MaxOutputTokenCount = 50
        };

        try
        {
            var response = await _chatClient.CompleteChatAsync(messages, options, ct);
            var result = response.Value.Content[0].Text.Trim().Trim('"'); 

            _logger.LogInformation("GPT returned: {Result}", result);

            var parts = result.Split('|');
            if (parts.Length == 2 && float.TryParse(parts[1].Trim('"'), System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var confidence))
            {
                var eventName = parts[0].Trim().Trim('"');

                if (eventName.Equals("NONE", StringComparison.OrdinalIgnoreCase) || confidence < 0.5f)
                {
                    _logger.LogInformation("No event detected (confidence: {Confidence:F2})", confidence);
                    return new EventExtractionResult { EventName = null, Confidence = confidence };
                }

                _logger.LogInformation("Event extracted: {EventName} (confidence: {Confidence:F2})", eventName, confidence);
                await _statisticsService.IncrementGptEventExtractorAsync();

                return new EventExtractionResult { EventName = eventName, Confidence = confidence };
            }

            _logger.LogWarning("Failed to parse GPT response: {Result}", result);
            return new EventExtractionResult { EventName = null, Confidence = 0.0f };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GPT event extraction failed");
            throw;
        }
    }
}
