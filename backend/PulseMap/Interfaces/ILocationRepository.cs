using PulseMap.Domain;

namespace PulseMap.Interfaces;

public interface ILocationRepository
{
    Task<Location> AddLocationAsync(Location location);
    Task DeleteLocationAsync(Location location);
    Task<List<Location>> GetActiveLocationsAsync();
    Task<List<Location>> GetActiveLocationsInBoundsAsync(double minLat, double maxLat, double minLng, double maxLng);
    Task<List<Location>> GetAllLocationsAsync();
    Task<List<Location>> GetLikedLocationsByUserIdAsync(int userId);
    Task<Location?> GetLocationByIdAsync(int id);
    Task<Location?> GetLocationByOwnerIdAsync(int ownerId);
    Task<List<Location>> GetPlacedLocationsByUserIdAsync(int userId);
    Task<List<Location>> GetLocationsByEventIdAsync(int eventId, bool activeOnly = true);
    Task<List<Location>> GetLocationsByIdsAsync(List<int> ids);
    Task<Location> UpdateLocationAsync(Location location);
    Task<List<Location>> GetStarredLocationsAsync();
    Task ToggleStarAsync(int locationId);
    Task SaveChangesAsync();
}
