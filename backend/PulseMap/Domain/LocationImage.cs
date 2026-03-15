namespace PulseMap.Domain;

public class LocationImage
{
    public int Id { get; set; }
    public int LocationId { get; set; }
    public Location? Location { get; set; }
    public required string Url { get; set; }
    public required DateTime CreatedAt { get; set; }
    public required int Order { get; set; }
}
