namespace PulseMap.Domain.DTOs;

public class ResponseMessageResponseDTO
{
    public required int Id { get; set; }
    public required string Content { get; set; }
    public required SimplifiedUserResponseDTO Sender { get; set; }
    public required DateTime SentAt { get; set; }
    public required int LocationId { get; set; }
}
