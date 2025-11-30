using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PulseMap.Domain;

namespace PulseMap.Context.Configurations;

public class ResponseMessageConfiguration : IEntityTypeConfiguration<ResponseMessage>
{
    public void Configure(EntityTypeBuilder<ResponseMessage> builder)
    {
        builder.HasOne(r => r.ParentMessage)
            .WithMany(m => m.Responses)
            .HasForeignKey(r => r.ParentMessageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(r => r.ParentMessageId);
    }
}
