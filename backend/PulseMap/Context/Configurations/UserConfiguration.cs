using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PulseMap.Domain;
using PulseMap.Domain.Enums;

namespace PulseMap.Context.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.FirstName)
            .IsRequired();

        builder.Property(u => u.LastName)
            .IsRequired();

        builder.Property(u => u.UserName)
            .IsRequired();

        builder.Property(u => u.Email)
            .IsRequired();

        builder.Property(u => u.Password)
            .IsRequired();

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.Property(u => u.Role)
            .IsRequired()
            .HasConversion(
                v => v.ToString(),
                v => (UserRole)Enum.Parse(typeof(UserRole), v)
            )
            .HasDefaultValue(UserRole.User);
    }
}
