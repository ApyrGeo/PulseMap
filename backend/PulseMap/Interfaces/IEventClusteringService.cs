using PulseMap.Domain;

namespace PulseMap.Interfaces;

public record EventClusteringResult
{
    public List<Event> EventsCreated { get; set; } = [];
    public List<Event> EventsUpdated { get; set; } = [];
    public int LocationsAssigned { get; set; }
    public int LocationsIgnored { get; set; }
}

public interface IEventClusteringService
{
    Task<EventClusteringResult> ClusterLocationsAsync(
        List<Location> locations,
        double maxDistanceMeters,
        CancellationToken ct
    );
}
