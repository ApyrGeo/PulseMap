namespace PulseMap.Domain.DTOs;

public record CategoryResponseDTO
{
    public required int Id { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public required bool IsActive { get; set; }
    public required int SortOrder { get; set; }
}
