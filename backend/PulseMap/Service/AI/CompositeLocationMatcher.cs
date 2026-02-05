using PulseMap.Interfaces;

namespace PulseMap.Service.AI;

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

        // Step 1: Try GPT-based matching first (if available)
        if (_gptMatcher != null)
        {
            try
            {
                _logger.LogInformation("Attempting GPT-based matching (primary)");
                var gptResult = await _gptMatcher.MatchLocationsAsync(description1, description2, ct);

                if (gptResult == LocationMatchResult.SameLocation)
                {
                    _logger.LogInformation("GPT returned HIGH confidence (Same location) - taking action");
                    return LocationMatchResult.SameLocation;
                }

                if (gptResult == LocationMatchResult.DifferentLocation)
                {
                    _logger.LogInformation("GPT returned LOW confidence (Different location) - ignoring pair");
                    return LocationMatchResult.DifferentLocation;
                }

                // Step 2: Uncertain result (PossiblySameLocation), verify with Embeddings
                if (_embeddingMatcher != null)
                {
                    _logger.LogInformation("GPT uncertain (Possibly same location) - verifying with embeddings");
                    
                    try
                    {
                        var embeddingResult = await _embeddingMatcher.MatchLocationsAsync(description1, description2, ct);

                        if (embeddingResult == LocationMatchResult.SameLocation)
                        {
                            _logger.LogInformation("Embeddings confirmed HIGH confidence (Same location) - taking action");
                            return LocationMatchResult.SameLocation;
                        }

                        _logger.LogInformation("Embeddings did not confirm - using result: {Result}", embeddingResult);
                        return embeddingResult;
                    }
                    catch (Exception embEx)
                    {
                        _logger.LogWarning(embEx, "Embeddings matching failed, using GPT result: {Result}", gptResult);
                        return gptResult;
                    }
                }
                else
                {
                    return gptResult;
                }
            }
            catch (Exception gptEx)
            {
                _logger.LogWarning(gptEx, "GPT matching failed, falling back to embeddings");
            }
        }

        // Step 3: Try embeddings if GPT is not available or failed
        if (_embeddingMatcher != null)
        {
            try
            {
                _logger.LogInformation("Attempting embeddings-based matching");
                var embeddingResult = await _embeddingMatcher.MatchLocationsAsync(description1, description2, ct);
                return embeddingResult;
            }
            catch (Exception embEx)
            {
                _logger.LogWarning(embEx, "Embeddings matching failed, falling back to keyword matching");
            }
        }

        // Step 4: Fallback to keyword-based matching (always available, free)
        _logger.LogInformation("Using keyword-based matching (free fallback)");
        return await _keywordMatcher.MatchLocationsAsync(description1, description2, ct);
    }
}
