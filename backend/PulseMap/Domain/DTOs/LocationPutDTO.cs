using PulseMap.Domain.Enums;

namespace PulseMap.Domain.DTOs;

public class LocationPutDTO
{
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required string Category { get; set; }
}
