namespace PulseMap.Domain;

public class ResponseMessage : Message
{
    public required int ParentMessageId { get; set; }
    public Message? ParentMessage { get; set; } = null;
}
