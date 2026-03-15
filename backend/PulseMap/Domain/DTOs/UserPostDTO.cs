using PulseMap.Domain.Enums;

namespace PulseMap.Domain.DTOs;

public class UserPostDTO
{
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public UserRole Role { get; set; } = UserRole.User;
}
