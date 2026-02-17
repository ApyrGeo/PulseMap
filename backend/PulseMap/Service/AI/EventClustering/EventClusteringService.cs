using PulseMap.Domain;
using PulseMap.Interfaces;

namespace PulseMap.Service.AI.EventClustering;

public class EventClusteringService : IEventClusteringService
{
    private readonly IEventExtractorService _eventExtractor;
    private readonly IEventRepository _eventRepository;
    private readonly ILocationRepository _locationRepository;
    private readonly IAIStatisticsService _statisticsService;
    private readonly ILogger<EventClusteringService> _logger;

    private const int MIN_LOCATIONS_FOR_EVENT = 3;
    private const float LOW_CONFIDENCE_THRESHOLD = 0.6f;

    public EventClusteringService(
        IEventExtractorService eventExtractor,
        IEventRepository eventRepository,
        ILocationRepository locationRepository,
        IAIStatisticsService statisticsService,
        ILogger<EventClusteringService> logger)
    {
        _eventExtractor = eventExtractor;
        _eventRepository = eventRepository;
        _locationRepository = locationRepository;
        _statisticsService = statisticsService;
        _logger = logger;
    }

    public async Task<EventClusteringResult> ClusterLocationsAsync(
        List<Location> locations,
        double maxDistanceMeters,
        CancellationToken ct)
    {
        _logger.LogInformation("\n");
        _logger.LogInformation("╔════════════════════════════════════════════════════════╗");
        _logger.LogInformation("║     EVENT CLUSTERING SERVICE - STARTING ANALYSIS      ║");
        _logger.LogInformation("╚════════════════════════════════════════════════════════╝");
        _logger.LogInformation("Total locations to analyze: {Count}", locations.Count);
        _logger.LogInformation("Max distance threshold: {Distance}m", maxDistanceMeters);

        var result = new EventClusteringResult();
        var eventCandidates = new Dictionary<string, List<(Location location, float confidence)>>();

        // Step 1: Extract event names from all locations
        _logger.LogInformation("\n--- STEP 1: Extracting event names from descriptions ---");
        
        foreach (var location in locations)
        {
            if (string.IsNullOrWhiteSpace(location.Description))
            {
                _logger.LogDebug("Location {LocationId} has no description, skipping", location.Id);
                result.LocationsIgnored++;
                continue;
            }

            _logger.LogInformation("\nAnalyzing Location {LocationId}: {Description}",
                location.Id,
                location.Description.Substring(0, Math.Min(80, location.Description.Length)));

            var extraction = await _eventExtractor.ExtractEventNameAsync(location.Description, ct);

            if (extraction.EventName != null)
            {
                _logger.LogInformation("✅ Event detected: '{EventName}' (confidence: {Confidence:F2})",
                    extraction.EventName, extraction.Confidence);

                if (!eventCandidates.ContainsKey(extraction.EventName))
                {
                    eventCandidates[extraction.EventName] = new List<(Location, float)>();
                }

                eventCandidates[extraction.EventName].Add((location, extraction.Confidence));
            }
            else
            {
                _logger.LogInformation("⚠️ No event detected");
                result.LocationsIgnored++;
            }
        }

        // Step 2: Process each event candidate
        _logger.LogInformation("\n--- STEP 2: Processing event candidates ---");
        _logger.LogInformation("Total unique events detected: {Count}", eventCandidates.Count);

        foreach (var (eventName, locationGroup) in eventCandidates)
        {
            _logger.LogInformation("\n========================================");
            _logger.LogInformation("Processing Event: '{EventName}'", eventName);
            _logger.LogInformation("Locations mentioning this event: {Count}", locationGroup.Count);

            if (locationGroup.Count < MIN_LOCATIONS_FOR_EVENT)
            {
                _logger.LogWarning("❌ Not enough locations ({Count} < {Min}), skipping event creation",
                    locationGroup.Count, MIN_LOCATIONS_FOR_EVENT);
                result.LocationsIgnored += locationGroup.Count;
                continue;
            }

            // Check if event already exists
            var existingEvent = await _eventRepository.GetEventByNameAsync(eventName);

            if (existingEvent != null)
            {
                _logger.LogInformation("📝 Event already exists (ID: {EventId}), updating...", existingEvent.Id);
                await UpdateExistingEventAsync(existingEvent, locationGroup, maxDistanceMeters, result);
            }
            else
            {
                _logger.LogInformation("✨ Creating new event...");
                await CreateNewEventAsync(eventName, locationGroup, result);
            }
        }

        await _statisticsService.IncrementEventClusteringRunAsync();

        _logger.LogInformation("\n");
        _logger.LogInformation("╔════════════════════════════════════════════════════════╗");
        _logger.LogInformation("║          EVENT CLUSTERING - FINAL SUMMARY             ║");
        _logger.LogInformation("╚════════════════════════════════════════════════════════╝");
        _logger.LogInformation("Events created: {Created}", result.EventsCreated.Count);
        _logger.LogInformation("Events updated: {Updated}", result.EventsUpdated.Count);
        _logger.LogInformation("Locations assigned: {Assigned}", result.LocationsAssigned);
        _logger.LogInformation("Locations ignored: {Ignored}", result.LocationsIgnored);
        _logger.LogInformation("\n");

        return result;
    }

    private async Task CreateNewEventAsync(
        string eventName,
        List<(Location location, float confidence)> locationGroup,
        EventClusteringResult result)
    {
        var locations = locationGroup.Select(lg => lg.location).ToList();
        var avgConfidence = locationGroup.Average(lg => lg.confidence);

        // Calculate centroid
        var centroid = CalculateCentroid(locations);

        // Create event
        var newEvent = new Event
        {
            Name = eventName,
            IsAIGenerated = true,
            RequiresReview = avgConfidence < LOW_CONFIDENCE_THRESHOLD,
            ConfidenceScore = avgConfidence,
            Latitude = centroid.Latitude,
            Longitude = centroid.Longitude,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = locations.Max(l => l.ExpiresAt),
            IsExpired = false,
            Locations = new List<Location>()
        };

        var savedEvent = await _eventRepository.AddEventAsync(newEvent);

        // Assign locations to event
        foreach (var (location, confidence) in locationGroup)
        {
            location.EventId = savedEvent.Id;
            location.EventAssignmentConfidence = confidence;
            await _locationRepository.UpdateLocationAsync(location);
            result.LocationsAssigned++;
        }

        result.EventsCreated.Add(savedEvent);

        _logger.LogInformation("✅ Event '{EventName}' created (ID: {EventId}, confidence: {Confidence:F2}, requiresReview: {RequiresReview})",
            eventName, savedEvent.Id, avgConfidence, newEvent.RequiresReview);
    }

    private async Task UpdateExistingEventAsync(
        Event existingEvent,
        List<(Location location, float confidence)> locationGroup,
        double maxDistanceMeters,
        EventClusteringResult result)
    {
        var newLocations = new List<Location>();

        foreach (var (location, confidence) in locationGroup)
        {
            // Check if location is within distance threshold
            var distance = CalculateDistance(
                existingEvent.Latitude, existingEvent.Longitude,
                location.Latitude, location.Longitude);

            if (distance <= maxDistanceMeters)
            {
                location.EventId = existingEvent.Id;
                location.EventAssignmentConfidence = confidence;
                await _locationRepository.UpdateLocationAsync(location);
                newLocations.Add(location);
                result.LocationsAssigned++;

                _logger.LogInformation("✅ Location {LocationId} assigned to event (distance: {Distance:F1}m, confidence: {Confidence:F2})",
                    location.Id, distance, confidence);
            }
            else
            {
                _logger.LogWarning("⚠️ Location {LocationId} too far from event centroid ({Distance:F1}m > {MaxDistance}m), ignoring",
                    location.Id, distance, maxDistanceMeters);
                result.LocationsIgnored++;
            }
        }

        if (newLocations.Any())
        {
            // Recalculate centroid with all ACTIVE locations (existing + new)
            var allActiveLocations = await _locationRepository.GetLocationsByEventIdAsync(existingEvent.Id, activeOnly: true);
            var centroid = CalculateCentroid(allActiveLocations);

            existingEvent.Latitude = centroid.Latitude;
            existingEvent.Longitude = centroid.Longitude;
            existingEvent.ExpiresAt = allActiveLocations.Max(l => l.ExpiresAt);

            // Recalculate confidence
            var avgConfidence = allActiveLocations.Average(l => l.EventAssignmentConfidence ?? 1.0f);
            existingEvent.ConfidenceScore = avgConfidence;
            existingEvent.RequiresReview = avgConfidence < LOW_CONFIDENCE_THRESHOLD;

            await _eventRepository.UpdateEventAsync(existingEvent);

            result.EventsUpdated.Add(existingEvent);

            _logger.LogInformation("✅ Event '{EventName}' updated (new centroid: {Lat:F6}, {Lng:F6}, {NewLocations} locations added)",
                existingEvent.Name, existingEvent.Latitude, existingEvent.Longitude, newLocations.Count);
        }
    }

    private (double Latitude, double Longitude) CalculateCentroid(List<Location> locations)
    {
        if (!locations.Any())
            throw new ArgumentException("Cannot calculate centroid of empty location list");

        var avgLat = locations.Average(l => l.Latitude);
        var avgLng = locations.Average(l => l.Longitude);

        return (avgLat, avgLng);
    }

    private double CalculateDistance(double lat1, double lng1, double lat2, double lng2)
    {
        const double EarthRadiusMeters = 6371000;

        var dLat = ToRadians(lat2 - lat1);
        var dLng = ToRadians(lng2 - lng1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusMeters * c;
    }

    private double ToRadians(double degrees)
    {
        return degrees * Math.PI / 180.0;
    }
}
