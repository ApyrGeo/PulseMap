namespace PulseMap.Domain.DTOs;

public record CategoryPostDTO
{
    public required string Name { get; set; }
    public string? Slug { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; } = 0;
}
