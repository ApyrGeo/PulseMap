using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PulseMap.Domain;

namespace PulseMap.Context.Configurations;

public class AIStatisticsConfiguration : IEntityTypeConfiguration<AIStatistics>
{
    public void Configure(EntityTypeBuilder<AIStatistics> builder)
    {
        builder.HasKey(s => s.Id);
        
        builder.Property(s => s.HuggingFaceClassifierSuccess).HasDefaultValue(0);
        builder.Property(s => s.OpenAIClassifierSuccess).HasDefaultValue(0);
        builder.Property(s => s.KeywordClassifierFallback).HasDefaultValue(0);
        
        builder.Property(s => s.GptMatcherSuccess).HasDefaultValue(0);
        builder.Property(s => s.EmbeddingMatcherSuccess).HasDefaultValue(0);
        builder.Property(s => s.KeywordMatcherFallback).HasDefaultValue(0);
        
        builder.Property(s => s.TranslationsPerformed).HasDefaultValue(0);
        builder.Property(s => s.TotalClassificationCalls).HasDefaultValue(0);
        builder.Property(s => s.TotalMatchingCalls).HasDefaultValue(0);
        
        builder.Property(s => s.LastUpdated).HasDefaultValueSql("CURRENT_TIMESTAMP");
        
        // Seed initial row with static date
        builder.HasData(new AIStatistics
        {
            Id = 1,
            LastUpdated = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }
}
