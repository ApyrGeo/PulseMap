using PulseMap.Domain.DTOs;

namespace PulseMap.Interfaces;

public interface ILocationService
{
    Task<LocationResponseDTO> AddLocationAsync(LocationPostDTO locationPostDTO);
    Task DeleteLocationAsync(int id);
    Task<LocationResponseDTO> ExpireLocationAsync(int id);
    Task<LocationResponseDTO> ExtendLocationExpirationAsync(int id);
    Task<List<LocationResponseDTO>> GetActiveLocationsAsync(int userId = 1);
    Task<List<LocationResponseDTO>> GetActiveLocationsInBoundsAsync(double minLat, double maxLat, double minLng, double maxLng, string? type, int userId = 1);
    Task<List<LocationResponseDTO>> GetAllLocationsAsync(int userId = 1);
    Task<LocationResponseDTO?> GetLocationByIdAsync(int id, int userId = 1);
    Task<LocationResponseDTO> LikeLocationAsync(int id, int userId);
    Task<LocationResponseDTO?> UpdateLocationAsync(LocationPutDTO locationResponseDTO, int id);
    Task<List<(int Location1Id, int Location2Id, double Distance)>> GetNearbyLocationPairsAsync(double maxDistanceMeters = 20);
    Task<bool> MergeLocationsAsync(int keepLocationId, int removeLocationId);
    Task<List<LocationResponseDTO>> GetLocationsNeedingReviewAsync(int? eventId = null);
    Task<LocationResponseDTO> ConfirmLocationEventAsync(int locationId);
    Task<LocationResponseDTO> RejectLocationEventAsync(int locationId);
}
