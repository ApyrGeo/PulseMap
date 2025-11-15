using PulseMap.Domain;
using PulseMap.Domain.DTOs;

namespace PulseMap.Interfaces;

public interface IUserRepository
{
    Task<User?> GetUserByIdAsync(int id);
    Task<User> CreateUserAsync(User user);
    Task SaveChangesAsync();
    Task<User?> GetUserByEmailAsync(string email);
}
