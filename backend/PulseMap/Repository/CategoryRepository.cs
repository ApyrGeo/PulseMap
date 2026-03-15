using Microsoft.EntityFrameworkCore;
using PulseMap.Context;
using PulseMap.Domain;
using PulseMap.Interfaces;

namespace PulseMap.Repository;

public class CategoryRepository(PulseMapContext context) : ICategoryRepository
{
    private readonly PulseMapContext _context = context;

    public async Task<List<Category>> GetCategoriesAsync(bool onlyActive = true)
    {
        IQueryable<Category> query = _context.Categories;

        if (onlyActive)
        {
            query = query.Where(c => c.IsActive);
        }

        return await query
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Name)
            .ToListAsync();
    }

    public Task<Category?> GetByNameAsync(string categoryName)
    {
        return _context.Categories
            .FirstOrDefaultAsync(c => c.Name.ToLower() == categoryName.ToLower());
    }

    public Task<Category?> GetByIdAsync(int id)
    {
        return _context.Categories.FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<Category> AddAsync(Category category)
    {
        await _context.Categories.AddAsync(category);
        return category;
    }

    public Task SaveChangesAsync()
    {
        return _context.SaveChangesAsync();
    }
}
