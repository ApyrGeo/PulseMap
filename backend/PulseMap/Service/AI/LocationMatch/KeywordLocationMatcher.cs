using PulseMap.Interfaces;

namespace PulseMap.Service.AI.LocationMatch;

public class KeywordLocationMatcher : ILocationMatcher
{
    private readonly ILogger<KeywordLocationMatcher> _logger;
    private readonly IAIStatisticsService _statisticsService;

    public KeywordLocationMatcher(
        ILogger<KeywordLocationMatcher> logger,
        IAIStatisticsService statisticsService)
    {
        _logger = logger;
        _statisticsService = statisticsService;
    }

    public async Task<LocationMatchResult> MatchLocationsAsync(string description1, string description2, CancellationToken ct)
    {
        _logger.LogInformation("Matching locations using keyword-based similarity");

        var desc1Lower = description1.ToLowerInvariant();
        var desc2Lower = description2.ToLowerInvariant();

        var stopWords = new HashSet<string> { "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "from" };
        
        var words1 = desc1Lower.Split(new[] { ' ', ',', '.', '!', '?' }, StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 2 && !stopWords.Contains(w))
            .ToHashSet();

        var words2 = desc2Lower.Split(new[] { ' ', ',', '.', '!', '?' }, StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 2 && !stopWords.Contains(w))
            .ToHashSet();

        if (words1.Count == 0 || words2.Count == 0)
        {
            _logger.LogWarning("One or both descriptions have no significant words");
            return LocationMatchResult.DifferentLocation;
        }

        // Jaccard similarity: intersection / union
        var intersection = words1.Intersect(words2).Count();
        var union = words1.Union(words2).Count();
        var similarity = (double)intersection / union;

        _logger.LogInformation("Keyword similarity: {Similarity:F4} (intersection: {Intersection}, union: {Union})", 
            similarity, intersection, union);

        LocationMatchResult result;
        if (similarity > 0.6)
        {
            result = LocationMatchResult.SameLocation;
            _logger.LogInformation("HIGH confidence: Same location (similarity: {Similarity:F4})", similarity);
            await _statisticsService.IncrementKeywordMatcherFallbackAsync();
        }
        else if (similarity > 0.4)
        {
            result = LocationMatchResult.PossiblySameLocation;
            _logger.LogInformation("MEDIUM confidence: Possibly same location (similarity: {Similarity:F4})", similarity);
            await _statisticsService.IncrementKeywordMatcherFallbackAsync();
        }
        else
        {
            result = LocationMatchResult.DifferentLocation;
            _logger.LogInformation("LOW confidence: Different location (similarity: {Similarity:F4})", similarity);
        }

        return result;
    }
}
