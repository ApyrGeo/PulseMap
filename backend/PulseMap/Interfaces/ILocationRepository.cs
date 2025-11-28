using PulseMap.Domain;

namespace PulseMap.Interfaces;

public interface ILocationRepository
{
    Task<Location> AddLocationAsync(Location location);
    Task DeleteLocationAsync(Location location);
    Task<List<Location>> GetActiveLocationsAsync();
    Task<List<Location>> GetAllLocationsAsync();
    Task<Location?> GetLocationByIdAsync(int id);
    Task SaveChangesAsync();
}
