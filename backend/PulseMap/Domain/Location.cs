namespace PulseMap.Domain;

public class Location
{
    public required int Id { get; set; }
    public required double Latitude { get; set; }
    public required double Longitude { get; set; }
    public required string Name { get; set; } = string.Empty;
    public required string? Description { get; set; } = string.Empty;

    public required int? CreatorId { get; set; } = null;
    public User? Creator { get; set; } = null;
}
