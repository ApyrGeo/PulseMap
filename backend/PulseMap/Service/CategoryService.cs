using Backend.Exceptions.Custom;
using PulseMap.Domain;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;
using System.Text.RegularExpressions;

namespace PulseMap.Service;

public class CategoryService(ICategoryRepository categoryRepository) : ICategoryService
{
    private readonly ICategoryRepository _categoryRepository = categoryRepository;

    public async Task<List<CategoryResponseDTO>> GetCategoriesAsync(bool onlyActive = true)
    {
        var categories = await _categoryRepository.GetCategoriesAsync(onlyActive);

        return [.. categories.Select(c => new CategoryResponseDTO
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            IsActive = c.IsActive,
            SortOrder = c.SortOrder
        })];
    }

    public async Task<CategoryResponseDTO> AddCategoryAsync(CategoryPostDTO dto)
    {
        var normalizedName = dto.Name.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName))
        {
            throw new EntityValidationException("Category name is required.");
        }

        var existing = await _categoryRepository.GetByNameAsync(normalizedName);
        if (existing != null)
        {
            throw new EntityValidationException($"Category '{normalizedName}' already exists.");
        }

        var slug = string.IsNullOrWhiteSpace(dto.Slug)
            ? GenerateSlug(normalizedName)
            : GenerateSlug(dto.Slug);

        var category = new Category
        {
            Name = normalizedName,
            Slug = slug,
            IsActive = dto.IsActive,
            SortOrder = dto.SortOrder
        };

        await _categoryRepository.AddAsync(category);
        await _categoryRepository.SaveChangesAsync();

        return new CategoryResponseDTO
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            IsActive = category.IsActive,
            SortOrder = category.SortOrder
        };
    }

    private static string GenerateSlug(string input)
    {
        var slug = input.Trim().ToLowerInvariant();
        slug = Regex.Replace(slug, "[^a-z0-9\\s-]", "");
        slug = Regex.Replace(slug, "\\s+", "-");
        slug = Regex.Replace(slug, "-+", "-");
        return slug.Trim('-');
    }
}
