using PulseMap.Domain;

namespace PulseMap.Interfaces;

public interface IEventRepository
{
    Task<Event?> GetEventByIdAsync(int id);
    Task<Event?> GetEventByNameAsync(string name);
    Task<List<Event>> GetAllEventsAsync();
    Task<List<Event>> GetActiveEventsAsync();
    Task<List<Event>> GetEventsInBoundsAsync(double minLat, double maxLat, double minLng, double maxLng, bool activeOnly = true);
    Task<Event> AddEventAsync(Event eventEntity);
    Task<Event> UpdateEventAsync(Event eventEntity);
    Task DeleteEventAsync(int id);
}
