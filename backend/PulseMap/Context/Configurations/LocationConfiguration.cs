using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PulseMap.Domain;

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

        builder.Property(l => l.CategoryId)
            .HasDefaultValue(1)
            .IsRequired();

        builder.HasOne(l => l.Category)
            .WithMany(c => c.Locations)
            .HasForeignKey(l => l.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(l => l.ExpiresAt)
            .IsRequired();

        builder.Property(l => l.IsExpired)
            .HasDefaultValue(false)
            .IsRequired();

        builder.HasMany(l => l.Likes)
            .WithMany(u => u.LikedLocations)
            .UsingEntity<Dictionary<string, object>>(
            "LocationLikes",
            j => j.HasOne<User>().WithMany().HasForeignKey("UserId"),
            j => j.HasOne<Location>().WithMany().HasForeignKey("LocationId")
        );

        builder.HasOne(l => l.Owner)
            .WithMany(o => o.OwnedLocations)
            .HasForeignKey(l => l.OwnerId);

        builder.HasOne(l => l.LikeStatus)
            .WithOne(ls => ls.Location)
            .HasForeignKey<LikeStatus>(ls => ls.LocationId);

        builder.Property(l => l.RequiresReview)
            .HasDefaultValue(false)
            .IsRequired();
    }
}
