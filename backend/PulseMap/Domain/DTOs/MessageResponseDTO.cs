namespace PulseMap.Domain.DTOs;

public class MessageResponseDTO
{
    public required int Id { get; set; }
    public required string Content { get; set; }
    public required SimplifiedUserResponseDTO Sender { get; set; }
    public required DateTime SentAt { get; set; }
    public required List<ResponseMessageResponseDTO> Responses { get; set; }
    public required int LocationId { get; set; }
}
