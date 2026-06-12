namespace PulseMap.Domain.DTOs;

public record LocationResponseDTO
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
    public required bool IsExpired { get; set; }
    public required int LikesCount { get; set; }
    public required bool IsLikedByCurrentUser { get; set; }
    public SimplifiedUserResponseDTO? Owner { get; set; }

    public List<string>? ImageUrls { get; set; }

    public required bool IsStarred { get; set; }

    public SimplifiedEventResponseDTO? Event { get; set; }
    public float? EventAssignmentConfidence { get; set; }
    public required bool RequiresReview { get; set; }
}
