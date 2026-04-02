using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PulseMap.Domain;

namespace PulseMap.Context.Configurations;

public class InteractionConfiguration : IEntityTypeConfiguration<Interaction>
{
    public void Configure(EntityTypeBuilder<Interaction> builder)
    {
        builder.HasKey(i => i.Id);

        builder.HasOne(i => i.User)
            .WithMany()
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Location)
            .WithMany()
            .HasForeignKey(i => i.LocationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(i => i.InteractedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.Property(i => i.Type)
            .HasConversion<int>();

        builder.HasIndex(i => new { i.UserId, i.LocationId });
    }
}
