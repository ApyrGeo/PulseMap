namespace PulseMap.Domain.DTOs;

public class LocationResponseDTO
{
    public required int Id { get; set; }
    public required double Latitude { get; set; }
    public required double Longitude { get; set; }
    public required string? Name { get; set; }
    public required string? Description { get; set; }
    public SimplifiedUserResponseDTO? Creator { get; set; }
    public required string? Category { get; set; }
    public List<MessageResponseDTO>? Messages { get; set; } = [];
    public required DateTime ExpiresAt { get; set; }
}
