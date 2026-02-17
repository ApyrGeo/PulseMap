namespace PulseMap.Domain.DTOs;

public record EventClusteringResultDTO
{
    public required List<EventResponseDTO> EventsCreated { get; set; } = [];
    public required List<EventResponseDTO> EventsUpdated { get; set; } = [];
    public required int LocationsAssigned { get; set; }
    public required int LocationsIgnored { get; set; }
}
