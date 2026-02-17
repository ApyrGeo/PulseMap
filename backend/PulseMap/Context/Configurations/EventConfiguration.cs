using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PulseMap.Domain;

namespace PulseMap.Context.Configurations;

public class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(e => e.IsAIGenerated)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(e => e.RequiresReview)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(e => e.ConfidenceScore)
            .HasDefaultValue(1.0f)
            .IsRequired();

        builder.Property(e => e.Latitude)
            .IsRequired();

        builder.Property(e => e.Longitude)
            .IsRequired();

        builder.Property(e => e.CreatedAt)
            .IsRequired();

        builder.Property(e => e.ExpiresAt)
            .IsRequired();

        builder.Property(e => e.IsExpired)
            .HasDefaultValue(false)
            .IsRequired();

        builder.HasMany(e => e.Locations)
            .WithOne(l => l.Event)
            .HasForeignKey(l => l.EventId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(e => e.Name);
        builder.HasIndex(e => new { e.Latitude, e.Longitude });
    }
}
