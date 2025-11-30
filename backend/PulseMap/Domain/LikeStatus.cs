namespace PulseMap.Domain;

public class LikeStatus
{
    public int Id { get; set; }
    public int LocationId { get; set; }
    public required Location Location { get; set; }
    public int PreviousLikeCount { get; set; }
    public required DateTime LastChecked { get; set; }
}
