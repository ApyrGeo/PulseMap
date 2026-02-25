using Microsoft.EntityFrameworkCore;
using PulseMap.Context;
using PulseMap.Domain;
using PulseMap.Interfaces;

namespace PulseMap.Service;

public class AIStatisticsService : IAIStatisticsService
{
    private readonly PulseMapContext _context;
    private readonly ILogger<AIStatisticsService> _logger;

    public AIStatisticsService(PulseMapContext context, ILogger<AIStatisticsService> logger)
    {
        _context = context;
        _logger = logger;
    }

    private async Task<AIStatistics> GetOrCreateStatsAsync()
    {
        var stats = await _context.AIStatistics.FirstOrDefaultAsync();
        
        if (stats == null)
        {
            stats = new AIStatistics
            {
                Id = 1,
                LastUpdated = DateTime.UtcNow
            };
            _context.AIStatistics.Add(stats);
            await _context.SaveChangesAsync();
        }
        
        return stats;
    }

    public async Task IncrementHuggingFaceClassifierAsync()
    {
        var stats = await GetOrCreateStatsAsync();
        stats.HuggingFaceClassifierSuccess++;
        stats.TotalClassificationCalls++;
        stats.LastUpdated = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        _logger.LogDebug("Incremented HuggingFace Classifier count");
    }

    public async Task IncrementOpenAIClassifierAsync()
    {
        var stats = await GetOrCreateStatsAsync();
        stats.OpenAIClassifierSuccess++;
        stats.TotalClassificationCalls++;
        stats.LastUpdated = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        _logger.LogDebug("Incremented OpenAI Classifier count");
    }

    public async Task IncrementKeywordClassifierFallbackAsync()
    {
        var stats = await GetOrCreateStatsAsync();
        stats.KeywordClassifierFallback++;
        stats.TotalClassificationCalls++;
        stats.LastUpdated = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        _logger.LogDebug("Incremented Keyword Classifier Fallback count");
    }

    public async Task IncrementGptMatcherAsync()
    {
        var stats = await GetOrCreateStatsAsync();
        stats.GptMatcherSuccess++;
        stats.TotalMatchingCalls++;
        stats.LastUpdated = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        _logger.LogDebug("Incremented GPT Matcher count");
    }

    public async Task IncrementEmbeddingMatcherAsync()
    {
        var stats = await GetOrCreateStatsAsync();
        stats.EmbeddingMatcherSuccess++;
        stats.TotalMatchingCalls++;
        stats.LastUpdated = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        _logger.LogDebug("Incremented Embedding Matcher count");
    }

    public async Task IncrementKeywordMatcherFallbackAsync()
    {
        var stats = await GetOrCreateStatsAsync();
        stats.KeywordMatcherFallback++;
        stats.TotalMatchingCalls++;
        stats.LastUpdated = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        _logger.LogDebug("Incremented Keyword Matcher Fallback count");
    }

    public async Task IncrementTranslationAsync()
    {
        var stats = await GetOrCreateStatsAsync();
        stats.TranslationsPerformed++;
        stats.LastUpdated = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        _logger.LogDebug("Incremented Translation count");
    }

    public async Task IncrementGptEventExtractorAsync()
    {
        var stats = await GetOrCreateStatsAsync();
        stats.GptEventExtractorSuccess++;
        stats.LastUpdated = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        _logger.LogDebug("Incremented GPT Event Extractor count");
    }

    public async Task IncrementEmbeddingEventExtractorAsync()
    {
        var stats = await GetOrCreateStatsAsync();
        stats.EmbeddingEventExtractorSuccess++;
        stats.LastUpdated = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        _logger.LogDebug("Incremented Embedding Event Extractor count");
    }

    public async Task IncrementEventClusteringRunAsync()
    {
        var stats = await GetOrCreateStatsAsync();
        stats.EventClusteringRuns++;
        stats.LastUpdated = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        _logger.LogDebug("Incremented Event Clustering Run count");
    }

    public async Task<AIStatistics> GetStatisticsAsync()
    {
        return await GetOrCreateStatsAsync();
    }
}
