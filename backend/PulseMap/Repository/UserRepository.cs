using Microsoft.EntityFrameworkCore;
using PulseMap.Context;
using PulseMap.Domain;
using PulseMap.Interfaces;

namespace PulseMap.Repository;

public class UserRepository(PulseMapContext context) : IUserRepository
{
    private readonly PulseMapContext _context = context;
    public async Task<User?> GetUserByIdAsync(int id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User> CreateUserAsync(User user)
    {
        _context.Users.Add(user);
        return user;
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public Task<User?> GetUserByEmailAsync(string email)
    {
        return _context.Users.SingleOrDefaultAsync(u => u.Email == email);
    }
}
