namespace PulseMap.Domain;

public class Event
{
    public int Id { get; set; }
    public required string Name { get; set; } = string.Empty;
    
    public required bool IsAIGenerated { get; set; } = false;
    public required bool RequiresReview { get; set; } = false;
    public required float ConfidenceScore { get; set; } = 1.0f;
    
    public required double Latitude { get; set; }
    public required double Longitude { get; set; }
    
    public required DateTime CreatedAt { get; set; }
    public required DateTime ExpiresAt { get; set; }
    public required bool IsExpired { get; set; } = false;
    
    public List<Location> Locations { get; set; } = [];
}
