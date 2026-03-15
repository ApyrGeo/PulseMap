using PulseMap.Domain.DTOs;

namespace PulseMap.Interfaces;

public interface ICategoryService
{
    Task<List<CategoryResponseDTO>> GetCategoriesAsync(bool onlyActive = true);
    Task<CategoryResponseDTO> AddCategoryAsync(CategoryPostDTO dto);
}
