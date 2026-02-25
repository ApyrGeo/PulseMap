namespace PulseMap.Domain;

public class Event
{
    public int Id { get; set; }
    public required string Name { get; set; } = string.Empty;
    
    // AI Metadata
    public required bool IsAIGenerated { get; set; } = false;
    public required bool RequiresReview { get; set; } = false;
    public required float ConfidenceScore { get; set; } = 1.0f;
    
    // Centroid (recalculated automatically)
    public required double Latitude { get; set; }
    public required double Longitude { get; set; }
    
    // Lifecycle
    public required DateTime CreatedAt { get; set; }
    public required DateTime ExpiresAt { get; set; }
    public required bool IsExpired { get; set; } = false;
    
    // Relations
    public List<Location> Locations { get; set; } = [];
}
