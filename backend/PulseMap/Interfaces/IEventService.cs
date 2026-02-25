using PulseMap.Domain.DTOs;

namespace PulseMap.Interfaces;

public interface IEventService
{
    Task<EventResponseDTO?> GetEventByIdAsync(int id, bool includeLocations = false);
    Task<List<EventResponseDTO>> GetAllEventsAsync(bool activeOnly = true);
    Task<List<EventResponseDTO>> GetEventsInBoundsAsync(double minLat, double maxLat, double minLng, double maxLng, bool activeOnly = true, bool includeLocations = false);
    Task<EventClusteringResultDTO> AnalyzeAndClusterLocationsAsync(double maxDistanceMeters = 100, CancellationToken ct = default);
    Task<EventResponseDTO> ConfirmEventAsync(int eventId);
    Task DeleteEventAsync(int id);
}
