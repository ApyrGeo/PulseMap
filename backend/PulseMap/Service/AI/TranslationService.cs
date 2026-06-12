using OpenAI.Chat;
using PulseMap.Interfaces;
using System.ClientModel;

namespace PulseMap.Service.AI;

public class TranslationService : ITranslationService
{
    private readonly ChatClient? _chatClient;
    private readonly ILogger<TranslationService> _logger;
    private readonly IAIStatisticsService _statisticsService;
    private readonly bool _isEnabled;

    public TranslationService(
        IConfiguration config, 
        ILogger<TranslationService> logger,
        IAIStatisticsService statisticsService)
    {
        _logger = logger;
        _statisticsService = statisticsService;

        var apiKey = config["OpenAI:ApiKey"];
        var model = config["OpenAI:Model"] ?? "gpt-3.5-turbo";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("OpenAI API key not configured - translation service will be disabled");
            _isEnabled = false;
            return;
        }

        _chatClient = new ChatClient(model, new ApiKeyCredential(apiKey));
        _isEnabled = true;
        _logger.LogInformation("Translation service initialized with model: {Model}", model);
    }

    public bool IsEnglish(string text)
    {
        // Simple heuristic: check for common Romanian/non-English words
        var romanianIndicators = new[] 
        { 
            "și", "în", "la", "cu", "de", "pentru", "într", "sau", "pe", 
            "este", "sunt", "ai", "am", "ă", "â", "î", "ș", "ț"
        };

        var lowerText = text.ToLowerInvariant();
        
        if (romanianIndicators.Any(indicator => lowerText.Contains(indicator)))
        {
            return false;
        }

        if (text.Length < 20)
        {
            return true;
        }

        return true;
    }

    public async Task<string> TranslateToEnglishIfNeededAsync(string text, CancellationToken ct)
    {
        if (!_isEnabled)
        {
            _logger.LogDebug("Translation service disabled, returning original text");
            return text;
        }

        if (IsEnglish(text))
        {
            _logger.LogDebug("Text appears to be in English, no translation needed");
            return text;
        }

        _logger.LogInformation("Translating text to English: {Text}", text.Substring(0, Math.Min(50, text.Length)));

        try
        {
            var messages = new List<ChatMessage>
            {
                new SystemChatMessage("You are a translator. Translate the following text to English. Return ONLY the translation, no explanations."),
                new UserChatMessage(text)
            };

            var options = new ChatCompletionOptions
            {
                Temperature = 0.3f,
                MaxOutputTokenCount = 200
            };

            var response = await _chatClient!.CompleteChatAsync(messages, options, ct);
            var translatedText = response.Value.Content[0].Text.Trim();

            _logger.LogInformation("Successfully translated to: {Translation}", 
                translatedText.Substring(0, Math.Min(50, translatedText.Length)));

            await _statisticsService.IncrementTranslationAsync();

            return translatedText;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Translation failed, returning original text");
            return text;
        }
    }
}
