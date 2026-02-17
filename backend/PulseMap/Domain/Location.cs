using PulseMap.Domain.Enums;

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

    public required Category Category { get; set; } = Category.NotSet;
    public List<Message>? Comments { get; set; } = [];

    public required DateTime ExpiresAt { get; set; }
    public required bool IsExpired { get; set; } = false;

    public List<User> Likes { get; set; } = [];
    public int? OwnerId { get; set; } = null;
    public User? Owner { get; set; } = null;

    public LikeStatus? LikeStatus { get; set; } = null;

    // Event clustering
    public int? EventId { get; set; } = null;
    public Event? Event { get; set; } = null;
    public float? EventAssignmentConfidence { get; set; } = null;
}
