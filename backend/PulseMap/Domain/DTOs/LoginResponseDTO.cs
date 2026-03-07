namespace PulseMap.Domain.DTOs;

public class LoginResponseDTO
{
    public required string Token { get; set; }
    public required UserResponseDTO User { get; set; }
    public required string ExpiresIn { get; set; }
}
