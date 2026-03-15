using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PulseMap.Domain;

namespace PulseMap.Context.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .HasMaxLength(64)
            .IsRequired();

        builder.Property(c => c.Slug)
            .HasMaxLength(64)
            .IsRequired();

        builder.HasIndex(c => c.Name)
            .IsUnique();

        builder.HasIndex(c => c.Slug)
            .IsUnique();

        builder.Property(c => c.IsActive)
            .HasDefaultValue(true)
            .IsRequired();

        builder.Property(c => c.SortOrder)
            .HasDefaultValue(0)
            .IsRequired();

        builder.HasData(
            new Category { Id = 1, Name = "Not Set", Slug = "not-set", IsActive = true, SortOrder = 0 },
            new Category { Id = 2, Name = "Music", Slug = "music", IsActive = true, SortOrder = 10 },
            new Category { Id = 3, Name = "Sport", Slug = "sport", IsActive = true, SortOrder = 20 },
            new Category { Id = 4, Name = "Food", Slug = "food", IsActive = true, SortOrder = 30 },
            new Category { Id = 5, Name = "Entertainment", Slug = "entertainment", IsActive = true, SortOrder = 40 },
            new Category { Id = 6, Name = "Education", Slug = "education", IsActive = true, SortOrder = 50 },
            new Category { Id = 7, Name = "Health", Slug = "health", IsActive = true, SortOrder = 60 },
            new Category { Id = 8, Name = "Technology", Slug = "technology", IsActive = true, SortOrder = 70 },
            new Category { Id = 9, Name = "Travel", Slug = "travel", IsActive = true, SortOrder = 80 },
            new Category { Id = 10, Name = "Art", Slug = "art", IsActive = true, SortOrder = 90 },
            new Category { Id = 11, Name = "Business", Slug = "business", IsActive = true, SortOrder = 100 }
        );
    }
}
