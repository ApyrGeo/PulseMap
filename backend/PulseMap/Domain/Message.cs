namespace PulseMap.Domain;

public class Message
{
    public required int Id { get; set; }
    public required string Content { get; set; } = string.Empty;
    public required int SenderId { get; set; }
    public required DateTime SentAt { get; set; }
    public required int LocationId { get; set; }

    public User? Sender { get; set; } = null;
    public Location? Location { get; set; } = null;

    public List<ResponseMessage>? Responses { get; set; } = [];
}
