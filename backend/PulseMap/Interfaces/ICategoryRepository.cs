using PulseMap.Domain;

namespace PulseMap.Interfaces;

public interface ICategoryRepository
{
    Task<List<Category>> GetCategoriesAsync(bool onlyActive = true);
    Task<Category?> GetByNameAsync(string categoryName);
    Task<Category?> GetByIdAsync(int id);
    Task<Category> AddAsync(Category category);
    Task SaveChangesAsync();
}
