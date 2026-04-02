namespace PulseMap.Domain;

public class Interaction
{
    public required int Id { get; set; }
    public required int UserId { get; set; }
    public User? User { get; set; }
    public required int LocationId { get; set; }
    public Location? Location { get; set; }
    public required DateTime InteractedAt { get; set; }
    public required InteractionType Type { get; set; }
}

public enum InteractionType
{
    Confirmed = 0,
    ProximityTap = 1
}
