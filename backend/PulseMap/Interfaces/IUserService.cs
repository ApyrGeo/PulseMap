using PulseMap.Domain.DTOs;

namespace PulseMap.Interfaces;

public interface IUserService
{
    Task<UserResponseDTO> GetUserByIdAsync(int id);
    Task<UserResponseDTO> CreateUserAsync(UserPostDTO userPostDTO);
    Task<LoginResponseDTO> LoginUser(string email, string password);
}
