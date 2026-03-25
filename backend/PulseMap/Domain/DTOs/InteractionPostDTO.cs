using PulseMap.Domain;

namespace PulseMap.Domain.DTOs;

public class InteractionPostDTO
{
    public required int UserId { get; set; }
    public required int LocationId { get; set; }
    public required InteractionType Type { get; set; }
}
