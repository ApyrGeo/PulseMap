namespace PulseMap.Domain.DTOs;

public record MessagePostDTO
{
    public required string Content { get; init; }
    public required int SenderId { get; init; }
    public required int LocationId { get; init; }
}
