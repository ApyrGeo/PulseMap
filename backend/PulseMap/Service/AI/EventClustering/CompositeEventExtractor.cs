using PulseMap.Interfaces;

namespace PulseMap.Service.AI.EventClustering;

public class CompositeEventExtractor : IEventExtractorService
{
    private readonly EmbeddingEventExtractor? _embeddingExtractor;
    private readonly GptEventExtractor? _gptExtractor;
    private readonly ILogger<CompositeEventExtractor> _logger;

    public CompositeEventExtractor(
        ILogger<CompositeEventExtractor> logger,
        EmbeddingEventExtractor? embeddingExtractor = null,
        GptEventExtractor? gptExtractor = null)
    {
        _logger = logger;
        _embeddingExtractor = embeddingExtractor;
        _gptExtractor = gptExtractor;
    }

    public async Task<EventExtractionResult> ExtractEventNameAsync(string description, CancellationToken ct)
    {
        _logger.LogInformation("\n========================================");
        _logger.LogInformation("=== Composite Event Extraction START ===");
        _logger.LogInformation("========================================");

        // Step 1: Try Embedding-based matching first (cheaper, matches existing events)
        if (_embeddingExtractor != null)
        {
            try
            {
                _logger.LogInformation("STEP 1: Trying Embedding-based extraction (compare with existing events)");
                var embeddingResult = await _embeddingExtractor.ExtractEventNameAsync(description, ct);

                if (embeddingResult.EventName != null && embeddingResult.Confidence >= 0.90f)
                {
                    _logger.LogInformation("✅ HIGH CONFIDENCE match with existing event: {EventName} (confidence: {Confidence:F2})",
                        embeddingResult.EventName, embeddingResult.Confidence);
                    return embeddingResult;
                }

                _logger.LogInformation("⚠️ No existing event matched or low confidence (confidence: {Confidence:F2})", 
                    embeddingResult.Confidence);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Embedding extraction failed, falling back to GPT");
            }
        }

        // Step 2: Try GPT extraction (can extract new event names)
        if (_gptExtractor != null)
        {
            try
            {
                _logger.LogInformation("STEP 2: Trying GPT-based extraction (can extract new event names)");
                var gptResult = await _gptExtractor.ExtractEventNameAsync(description, ct);

                if (gptResult.EventName != null && gptResult.Confidence >= 0.70f)
                {
                    _logger.LogInformation("✅ GPT extracted event: {EventName} (confidence: {Confidence:F2})",
                        gptResult.EventName, gptResult.Confidence);
                    return gptResult;
                }

                _logger.LogInformation("⚠️ GPT did not extract event or low confidence (confidence: {Confidence:F2})", 
                    gptResult.Confidence);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "GPT extraction failed");
            }
        }

        _logger.LogInformation("❌ No event extracted by any method");
        _logger.LogInformation("========================================");
        return new EventExtractionResult { EventName = null, Confidence = 0.0f };
    }
}
