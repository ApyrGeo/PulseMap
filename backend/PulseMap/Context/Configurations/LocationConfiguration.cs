using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PulseMap.Domain;
using PulseMap.Domain.Enums;

namespace PulseMap.Context.Configurations;

public class LocationConfiguration : IEntityTypeConfiguration<Location>
{
    public void Configure(EntityTypeBuilder<Location> builder)
    {
        builder.HasKey(l => l.Id);

        builder.Property(l => l.Latitude)
            .IsRequired();

        builder.Property(l => l.Longitude)
            .IsRequired();

        builder.Property(l => l.Name)
            .IsRequired();

        builder.HasOne(l => l.Creator)
            .WithMany(c => c.PlacedLocations)
            .HasForeignKey(l => l.CreatorId);

        builder.Property(l => l.Category)
            .HasDefaultValue(Category.NotSet)
            .IsRequired()
            .HasConversion(
                v => v.ToString(),
                v => (Category)Enum.Parse(typeof(Category), v));

        builder.Property(l => l.ExpiresAt)
            .IsRequired();

        builder.Property(l => l.IsExpired)
            .HasDefaultValue(false)
            .IsRequired();
    }
}
