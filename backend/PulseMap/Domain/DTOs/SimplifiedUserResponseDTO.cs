namespace PulseMap.Domain.DTOs;

public class SimplifiedUserResponseDTO
{
    public required int Id { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Username { get; set; }
}
