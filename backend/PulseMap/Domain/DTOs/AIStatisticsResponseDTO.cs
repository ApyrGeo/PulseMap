namespace PulseMap.Domain.DTOs;

public class AIStatisticsResponseDTO
{
    public ClassificationStats Classification { get; set; } = new();
    public MatchingStats Matching { get; set; } = new();
    public TranslationStats Translation { get; set; } = new();
    public EventStats Events { get; set; } = new();
    public DateTime LastUpdated { get; set; }

    public class ClassificationStats
    {
        public int HuggingFaceSuccess { get; set; }
        public int OpenAISuccess { get; set; }
        public int KeywordFallback { get; set; }
        public int TotalCalls { get; set; }
    }

    public class MatchingStats
    {
        public int GptSuccess { get; set; }
        public int EmbeddingSuccess { get; set; }
        public int KeywordFallback { get; set; }
        public int TotalCalls { get; set; }
    }

    public class TranslationStats
    {
        public int TranslationsPerformed { get; set; }
    }

    public class EventStats
    {
        public int GptEventExtractorSuccess { get; set; }
        public int EmbeddingEventExtractorSuccess { get; set; }
        public int EventClusteringRuns { get; set; }
    }

    public RecommendationStats Recommendations { get; set; } = new();

    public class RecommendationStats
    {
        public int RequestsTotal { get; set; }
        public int AiScoringSuccess { get; set; }
        public int FallbackCalls { get; set; }
    }
}
