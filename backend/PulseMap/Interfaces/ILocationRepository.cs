using PulseMap.Domain;

namespace PulseMap.Interfaces;

public interface ILocationRepository
{
    Task<Location> AddLocationAsync(Location location);
    Task<List<Location>> GetAllLocationsAsync();
    Task<Location?> GetLocationByIdAsync(int id);
    Task SaveChangesAsync();
}
