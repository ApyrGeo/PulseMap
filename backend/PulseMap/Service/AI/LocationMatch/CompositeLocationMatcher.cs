using PulseMap.Interfaces;

namespace PulseMap.Service.AI.LocationMatch;

public class CompositeLocationMatcher : ILocationMatcher
{
    private readonly ILocationMatcher? _embeddingMatcher;
    private readonly ILocationMatcher? _gptMatcher;
    private readonly ILocationMatcher _keywordMatcher;
    private readonly ILogger<CompositeLocationMatcher> _logger;

    public CompositeLocationMatcher(
        KeywordLocationMatcher keywordMatcher,
        ILogger<CompositeLocationMatcher> logger,
        EmbeddingLocationMatcher? embeddingMatcher = null,
        GptLocationMatcher? gptMatcher = null)
    {
        _keywordMatcher = keywordMatcher;
        _embeddingMatcher = embeddingMatcher;
        _gptMatcher = gptMatcher;
        _logger = logger;
    }

    public async Task<LocationMatchResult> MatchLocationsAsync(string description1, string description2, CancellationToken ct)
    {
        _logger.LogInformation("Starting composite location matching");

        // Step 1: Try Embeddings first (cheaper, faster)
        if (_embeddingMatcher != null)
        {
            try
            {
                _logger.LogInformation("Attempting embeddings-based matching (primary, cheaper)");
                var embeddingResult = await _embeddingMatcher.MatchLocationsAsync(description1, description2, ct);

                if (embeddingResult == LocationMatchResult.SameLocation)
                {
                    _logger.LogInformation("Embeddings returned HIGH confidence (Same location) - taking action");
                    return LocationMatchResult.SameLocation;
                }

                if (embeddingResult == LocationMatchResult.DifferentLocation)
                {
                    _logger.LogInformation("Embeddings returned LOW confidence (Different location) - ignoring pair");
                    return LocationMatchResult.DifferentLocation;
                }

                // Step 2: Uncertain result (PossiblySameLocation), verify with GPT
                if (_gptMatcher != null)
                {
                    _logger.LogInformation("Embeddings uncertain (Possibly same location) - verifying with GPT");
                    
                    try
                    {
                        var gptResult = await _gptMatcher.MatchLocationsAsync(description1, description2, ct);

                        if (gptResult == LocationMatchResult.SameLocation)
                        {
                            _logger.LogInformation("GPT confirmed HIGH confidence (Same location) - taking action");
                            return LocationMatchResult.SameLocation;
                        }

                        _logger.LogInformation("GPT did not confirm - using result: {Result}", gptResult);
                        return gptResult;
                    }
                    catch (Exception gptEx)
                    {
                        _logger.LogWarning(gptEx, "GPT matching failed, using Embeddings result: {Result}", embeddingResult);
                        return embeddingResult;
                    }
                }
                else
                {
                    return embeddingResult;
                }
            }
            catch (Exception embEx)
            {
                _logger.LogWarning(embEx, "Embeddings matching failed, falling back to GPT");
            }
        }

        // Step 3: Try GPT if Embeddings is not available or failed
        if (_gptMatcher != null)
        {
            try
            {
                _logger.LogInformation("Attempting GPT-based matching");
                var gptResult = await _gptMatcher.MatchLocationsAsync(description1, description2, ct);
                return gptResult;
            }
            catch (Exception gptEx)
            {
                _logger.LogWarning(gptEx, "GPT matching failed, falling back to keyword matching");
            }
        }

        // Step 4: Fallback to keyword-based matching (always available, free)
        // Statistics tracked in KeywordLocationMatcher itself
        _logger.LogInformation("Using keyword-based matching (free fallback)");
        return await _keywordMatcher.MatchLocationsAsync(description1, description2, ct);
    }
}
