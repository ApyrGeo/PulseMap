namespace PulseMap.Domain.DTOs;

public class UserInteractionStatsDTO
{
    public required int UserId { get; set; }
    public required string Username { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required int TotalInteractions { get; set; }
}

public class LocationInteractionStatsDTO
{
    public required int LocationId { get; set; }
    public required string LocationName { get; set; }
    public required int TotalInteractions { get; set; }
    public required double Latitude { get; set; }
    public required double Longitude { get; set; }
}
