namespace PulseMap.Domain.DTOs;

public record EventResponseDTO
{
    public required int Id { get; set; }
    public required string Name { get; set; }
    
    public required bool IsAIGenerated { get; set; }
    public required bool RequiresReview { get; set; }
    public required float ConfidenceScore { get; set; }
    
    public required double Latitude { get; set; }
    public required double Longitude { get; set; }
    
    public required DateTime CreatedAt { get; set; }
    public required DateTime ExpiresAt { get; set; }
    public required bool IsExpired { get; set; }
    
    public required int LocationsCount { get; set; }
    public List<LocationResponseDTO>? Locations { get; set; }
}
