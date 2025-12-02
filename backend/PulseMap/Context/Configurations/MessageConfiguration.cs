using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PulseMap.Domain;

namespace PulseMap.Context.Configurations;

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.HasDiscriminator<string>("MessageType") 
            .HasValue<Message>("Message")
            .HasValue<ResponseMessage>("Response");

        builder.Property(m => m.Content)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(m => m.SentAt)
            .IsRequired();

        builder.HasOne(m => m.Sender)
            .WithMany(s => s.SentMessages)
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired();

        builder.HasOne(m => m.Location)
            .WithMany(l => l.Comments)
            .HasForeignKey(m => m.LocationId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasMany(m => m.Responses)
            .WithOne(r => r.ParentMessage)
            .HasForeignKey(r => r.ParentMessageId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
