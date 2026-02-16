using PulseMap.Domain;

namespace PulseMap.Interfaces;

public interface IAIStatisticsService
{
    Task IncrementHuggingFaceClassifierAsync();
    Task IncrementOpenAIClassifierAsync();
    Task IncrementKeywordClassifierFallbackAsync();
    
    Task IncrementGptMatcherAsync();
    Task IncrementEmbeddingMatcherAsync();
    Task IncrementKeywordMatcherFallbackAsync();
    
    Task IncrementTranslationAsync();
    
    Task<AIStatistics> GetStatisticsAsync();
}
