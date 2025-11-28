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
        var location = await _context.Locations
            .Include(l => l.Creator)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (location == null) return null;

        var allMessages = await _context.Messages
            .Where(m => m.LocationId == id)
            .Include(m => m.Sender)
            .OfType<Message>() 
            .ToListAsync();

        location.Comments = allMessages;

        foreach (var message in allMessages)
        {
            await _context.Entry(message)
                .Collection(m => m.Responses!)
                .Query()
                .Include(r => r.Sender)
                .LoadAsync();
        }

        return location;
    }
    public async Task<Location> AddLocationAsync(Location location)
    {
        _context.Locations.Add(location);
        return location;
    }

    public async Task<List<Location>> GetAllLocationsAsync()
    {
        return await _context.Locations
            .Include(l => l.Creator)
            .Include(l => l.Comments)
                .ThenInclude(c => c.Sender)
            .Include(l => l.Comments)
                .ThenInclude(c => c.Responses)
                    .ThenInclude(r => r.Sender)
            .ToListAsync();
    }
    public Task<List<Location>> GetActiveLocationsAsync()
    {
        return _context.Locations
            .Where(l => !l.IsExpired)
            .Include(l => l.Creator)
            .Include(l => l.Comments)
                .ThenInclude(c => c.Sender)
            .Include(l => l.Comments)
                .ThenInclude(c => c.Responses)
                    .ThenInclude(r => r.Sender)
            .ToListAsync();
    }
    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public async Task DeleteLocationAsync(Location location)
    {
        _context.Locations.Remove(location);
    }

}
