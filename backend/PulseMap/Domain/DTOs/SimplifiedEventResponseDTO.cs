namespace PulseMap.Domain.DTOs;

public record SimplifiedEventResponseDTO
{
    public required int Id { get; set; }
    public required string Name { get; set; }
    public required bool RequiresReview { get; set; }
    public required float ConfidenceScore { get; set; }
}
