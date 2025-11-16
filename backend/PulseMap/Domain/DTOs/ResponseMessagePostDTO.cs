namespace PulseMap.Domain.DTOs;

public record ResponseMessagePostDTO
{
    public required string Content { get; init; }
    public required int SenderId { get; init; }
}
