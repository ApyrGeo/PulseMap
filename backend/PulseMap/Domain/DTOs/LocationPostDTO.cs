namespace PulseMap.Domain.DTOs;

public class LocationPostDTO
{
    public required double Latitude { get; set; }
    public required double Longitude { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required int CreatorId { get; set; }
    public required string Category { get; set; }
}
