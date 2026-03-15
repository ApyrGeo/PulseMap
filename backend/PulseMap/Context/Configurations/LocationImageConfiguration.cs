using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PulseMap.Domain;

namespace PulseMap.Context.Configurations;

public class LocationImageConfiguration : IEntityTypeConfiguration<LocationImage>
{
    public void Configure(EntityTypeBuilder<LocationImage> builder)
    {
        builder.HasKey(li => li.Id);

        builder.Property(li => li.Url)
            .IsRequired()
            .HasMaxLength(2048);

        builder.Property(li => li.CreatedAt)
            .IsRequired();

        builder.Property(li => li.Order)
            .IsRequired()
            .HasDefaultValue(0);

        builder.HasOne(li => li.Location)
            .WithMany(l => l.Images)
            .HasForeignKey(li => li.LocationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(li => li.LocationId);
    }
}
