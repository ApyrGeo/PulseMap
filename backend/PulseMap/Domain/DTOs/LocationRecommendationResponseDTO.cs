namespace PulseMap.Domain.DTOs;

public record LocationRecommendationResponseDTO
{
    public required int Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public required string Category { get; set; }
    public required double Latitude { get; set; }
    public required double Longitude { get; set; }
    public required int LikesCount { get; set; }
    public required double Score { get; set; }
    public required string Reason { get; set; }
}
