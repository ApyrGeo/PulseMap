using PulseMap.Domain;

namespace PulseMap.Domain.DTOs;

public class InteractionResponseDTO
{
    public required int Id { get; set; }
    public required int UserId { get; set; }
    public required int LocationId { get; set; }
    public required string LocationName { get; set; }
    public required DateTime InteractedAt { get; set; }
    public required InteractionType Type { get; set; }
}
