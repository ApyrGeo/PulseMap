using PulseMap.Interfaces;

namespace PulseMap.Service.AI;

public class CompositeLocationClassifier : ILocationClassifier
{
    private readonly List<ILocationClassifier> _classifiers;
    private readonly ILogger<CompositeLocationClassifier> _logger;

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

    public CompositeLocationClassifier(
        IEnumerable<ILocationClassifier> classifiers,
        ILogger<CompositeLocationClassifier> logger)
    {
        _classifiers = classifiers.ToList();
        _logger = logger;
        
        _logger.LogInformation("Initialized Composite Classifier with {Count} classifiers", _classifiers.Count);
    }

    public async Task<List<string>> ClassifyLocationAsync(string description, CancellationToken ct)
    {
        _logger.LogInformation("Starting classification with {Count} available classifiers", _classifiers.Count);

        for (int i = 0; i < _classifiers.Count; i++)
        {
            var classifier = _classifiers[i];
            var classifierName = classifier.GetType().Name;

            try
            {
                _logger.LogInformation("Attempting classification with {Classifier} (attempt {Attempt}/{Total})",
                    classifierName, i + 1, _classifiers.Count);

                var result = await classifier.ClassifyLocationAsync(description, ct);

                // Validate result
                if (result != null && result.Count > 0 && !result.Contains("Uncategorized"))
                {
                    _logger.LogInformation("Successfully classified with {Classifier}: {Categories}",
                        classifierName, string.Join(", ", result));
                    return result;
                }

                _logger.LogWarning("{Classifier} returned Uncategorized or empty result, trying next classifier",
                    classifierName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "{Classifier} failed (attempt {Attempt}/{Total}), trying next classifier",
                    classifierName, i + 1, _classifiers.Count);
            }
        }

        // All classifiers failed, use keyword fallback
        _logger.LogWarning("All AI classifiers failed, using keyword-based fallback");
        return FallbackClassification(description);
    }

    private List<string> FallbackClassification(string description)
    {
        var lower = description.ToLowerInvariant();
        var matches = new List<string>();

        if (lower.Contains("muzic") || lower.Contains("concert") || lower.Contains("festival"))
            matches.Add("Music");
        if (lower.Contains("sport") || lower.Contains("fotbal") || lower.Contains("tenis") || lower.Contains("alergare"))
            matches.Add("Sport");
        if (lower.Contains("mancare") || lower.Contains("restaurant") || lower.Contains("cafenea") || lower.Contains("pizza"))
            matches.Add("Food");
        if (lower.Contains("film") || lower.Contains("teatru") || lower.Contains("entertainment") || lower.Contains("spectacol"))
            matches.Add("Entertainment");
        if (lower.Contains("scoala") || lower.Contains("universitate") || lower.Contains("curs") || lower.Contains("carte") || lower.Contains("student"))
            matches.Add("Education");
        if (lower.Contains("spital") || lower.Contains("sanatate") || lower.Contains("medical") || lower.Contains("doctor"))
            matches.Add("Health");
        if (lower.Contains("tech") || lower.Contains("it") || lower.Contains("software") || lower.Contains("calculator"))
            matches.Add("Technology");
        if (lower.Contains("calatorie") || lower.Contains("vacanta") || lower.Contains("turism") || lower.Contains("excursie"))
            matches.Add("Travel");
        if (lower.Contains("arta") || lower.Contains("pictura") || lower.Contains("sculptura") || lower.Contains("muzeu"))
            matches.Add("Art");
        if (lower.Contains("business") || lower.Contains("afaceri") || lower.Contains("conferinta") || lower.Contains("seminar"))
            matches.Add("Business");

        if (matches.Count == 0)
        {
            _logger.LogInformation("No keyword match found, returning Uncategorized");
            return new List<string> { "Uncategorized" };
        }

        var result = matches.Distinct().Take(3).ToList();
        _logger.LogInformation("Fallback classification returned: {Categories}", string.Join(", ", result));
        return result;
    }
}
