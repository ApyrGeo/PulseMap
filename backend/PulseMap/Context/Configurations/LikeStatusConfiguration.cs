using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PulseMap.Domain;

namespace PulseMap.Context.Configurations;

public class LikeStatusConfiguration : IEntityTypeConfiguration<LikeStatus>
{
    public void Configure(EntityTypeBuilder<LikeStatus> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(ls => ls.PreviousLikeCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(ls => ls.PreviousReportCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(ls => ls.LastChecked)
            .IsRequired();
    }
}
