using Microsoft.EntityFrameworkCore;
using PulseMap.Context;
using PulseMap.Domain;
using PulseMap.Interfaces;

namespace PulseMap.Repository;

public class LocationRepository(PulseMapContext context) : ILocationRepository
{
    private readonly PulseMapContext _context = context;
    public async Task<Location?> GetLocationByIdAsync(int id)
    {
        return await _context.Locations.FirstOrDefaultAsync(l => l.Id == id);
    }
    public async Task<Location> AddLocationAsync(Location location)
    {
        _context.Locations.Add(location);
        return location;
    }

    public async Task<List<Location>> GetAllLocationsAsync()
    {
        return await _context.Locations.Include(l => l.Creator).ToListAsync();
    }
    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
