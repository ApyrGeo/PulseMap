using Microsoft.EntityFrameworkCore;
using PulseMap.Context;
using PulseMap.Domain;
using PulseMap.Interfaces;

namespace PulseMap.Repository;

public class EventRepository : IEventRepository
{
    private readonly PulseMapContext _context;
    private readonly ILogger<EventRepository> _logger;

    public EventRepository(PulseMapContext context, ILogger<EventRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Event?> GetEventByIdAsync(int id)
    {
        return await _context.Events
            .Include(e => e.Locations)
                .ThenInclude(l => l.Creator)
            .FirstOrDefaultAsync(e => e.Id == id);
    }

    public async Task<Event?> GetEventByNameAsync(string name)
    {
        return await _context.Events
            .Include(e => e.Locations)
            .FirstOrDefaultAsync(e => e.Name == name);
    }

    public async Task<List<Event>> GetAllEventsAsync()
    {
        return await _context.Events
            .Include(e => e.Locations)
            .ToListAsync();
    }

    public async Task<List<Event>> GetActiveEventsAsync()
    {
        return await _context.Events
            .Include(e => e.Locations)
            .Where(e => !e.IsExpired)
            .ToListAsync();
    }

    public async Task<List<Event>> GetEventsInBoundsAsync(
        double minLat, double maxLat, double minLng, double maxLng, bool activeOnly = true)
    {
        var query = _context.Events
            .Include(e => e.Locations)
                .ThenInclude(l => l.Creator)
            .AsQueryable();

        if (activeOnly)
        {
            query = query.Where(e => !e.IsExpired);
        }

        return await query
            .Where(e => e.Latitude >= minLat && e.Latitude <= maxLat &&
                        e.Longitude >= minLng && e.Longitude <= maxLng)
            .ToListAsync();
    }

    public async Task<Event> AddEventAsync(Event eventEntity)
    {
        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();
        return eventEntity;
    }

    public async Task<Event> UpdateEventAsync(Event eventEntity)
    {
        _context.Events.Update(eventEntity);
        await _context.SaveChangesAsync();
        return eventEntity;
    }

    public async Task DeleteEventAsync(int id)
    {
        var eventEntity = await _context.Events.FindAsync(id);
        if (eventEntity != null)
        {
            _context.Events.Remove(eventEntity);
            await _context.SaveChangesAsync();
        }
    }
}
