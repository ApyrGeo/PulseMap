namespace PulseMap.Domain;

public class AIStatistics
{
    public int Id { get; set; }
    
    // Description Classification Stats
    public int HuggingFaceClassifierSuccess { get; set; }
    public int OpenAIClassifierSuccess { get; set; }
    public int KeywordClassifierFallback { get; set; }
    
    // Location Matching Stats
    public int GptMatcherSuccess { get; set; }
    public int EmbeddingMatcherSuccess { get; set; }
    public int KeywordMatcherFallback { get; set; }
    
    // Translation Stats
    public int TranslationsPerformed { get; set; }

    // Event Extraction Stats
    public int GptEventExtractorSuccess { get; set; }
    public int EmbeddingEventExtractorSuccess { get; set; }

    // Event Clustering Stats
    public int EventClusteringRuns { get; set; }

    // Recommendation Stats
    public int RecommendationRequestsTotal { get; set; }
    public int RecommendationAiSuccess { get; set; }
    public int RecommendationFallbackCalls { get; set; }

    // Timestamps
    public DateTime LastUpdated { get; set; }

    // Total calls
    public int TotalClassificationCalls { get; set; }
    public int TotalMatchingCalls { get; set; }
}
