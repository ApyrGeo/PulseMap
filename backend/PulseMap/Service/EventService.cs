using AutoMapper;
using Backend.Exceptions.Custom;
using PulseMap.Domain;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;

namespace PulseMap.Service;

public class EventService : IEventService
{
    private readonly IEventRepository _eventRepository;
    private readonly IEventClusteringService _clusteringService;
    private readonly ILocationRepository _locationRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<EventService> _logger;

    public EventService(
        IEventRepository eventRepository,
        IEventClusteringService clusteringService,
        ILocationRepository locationRepository,
        IMapper mapper,
        ILogger<EventService> logger)
    {
        _eventRepository = eventRepository;
        _clusteringService = clusteringService;
        _locationRepository = locationRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<EventResponseDTO?> GetEventByIdAsync(int id, bool includeLocations = false)
    {
        var eventEntity = await _eventRepository.GetEventByIdAsync(id);
        
        if (eventEntity == null)
        {
            throw new NotFoundException($"Event with ID {id} not found");
        }

        var dto = _mapper.Map<EventResponseDTO>(eventEntity);
        
        if (!includeLocations)
        {
            dto.Locations = null;
        }

        return dto;
    }

    public async Task<List<EventResponseDTO>> GetAllEventsAsync(bool activeOnly = true)
    {
        var events = activeOnly
            ? await _eventRepository.GetActiveEventsAsync()
            : await _eventRepository.GetAllEventsAsync();

        return _mapper.Map<List<EventResponseDTO>>(events);
    }

    public async Task<List<EventResponseDTO>> GetEventsInBoundsAsync(
        double minLat, double maxLat, double minLng, double maxLng, bool activeOnly = true, bool includeLocations = false)
    {
        var events = await _eventRepository.GetEventsInBoundsAsync(minLat, maxLat, minLng, maxLng, activeOnly);
        var dtos = _mapper.Map<List<EventResponseDTO>>(events);
        
        if (!includeLocations)
        {
            foreach (var dto in dtos)
            {
                dto.Locations = null;
            }
        }
        
        return dtos;
    }

    public async Task<EventClusteringResultDTO> AnalyzeAndClusterLocationsAsync(
        double maxDistanceMeters = 100, CancellationToken ct = default)
    {
        _logger.LogInformation("Starting event clustering analysis (maxDistance: {Distance}m)", maxDistanceMeters);

        var locations = await _locationRepository.GetActiveLocationsAsync();
        var unassignedLocations = locations.Where(l => l.EventId == null).ToList();

        _logger.LogInformation("Found {Total} active locations, {Unassigned} unassigned",
            locations.Count, unassignedLocations.Count);

        if (!unassignedLocations.Any())
        {
            _logger.LogInformation("No unassigned locations to cluster");
            return new EventClusteringResultDTO
            {
                EventsCreated = new List<EventResponseDTO>(),
                EventsUpdated = new List<EventResponseDTO>(),
                LocationsAssigned = 0,
                LocationsIgnored = 0
            };
        }

        var result = await _clusteringService.ClusterLocationsAsync(unassignedLocations, maxDistanceMeters, ct);

        return new EventClusteringResultDTO
        {
            EventsCreated = _mapper.Map<List<EventResponseDTO>>(result.EventsCreated),
            EventsUpdated = _mapper.Map<List<EventResponseDTO>>(result.EventsUpdated),
            LocationsAssigned = result.LocationsAssigned,
            LocationsIgnored = result.LocationsIgnored
        };
    }

    public async Task<EventResponseDTO> ConfirmEventAsync(int eventId)
    {
        var eventEntity = await _eventRepository.GetEventByIdAsync(eventId);
        
        if (eventEntity == null)
        {
            throw new NotFoundException($"Event with ID {eventId} not found");
        }

        eventEntity.RequiresReview = false;
        await _eventRepository.UpdateEventAsync(eventEntity);

        _logger.LogInformation("Event {EventId} confirmed by user", eventId);

        return _mapper.Map<EventResponseDTO>(eventEntity);
    }

    public async Task DeleteEventAsync(int id)
    {
        var eventEntity = await _eventRepository.GetEventByIdAsync(id);
        
        if (eventEntity == null)
        {
            throw new NotFoundException($"Event with ID {id} not found");
        }

        var locations = await _locationRepository.GetLocationsByEventIdAsync(id, activeOnly: false);
        foreach (var location in locations)
        {
            location.EventId = null;
            location.EventAssignmentConfidence = null;
            await _locationRepository.UpdateLocationAsync(location);
        }

        await _eventRepository.DeleteEventAsync(id);

        _logger.LogInformation("Event {EventId} deleted, {LocationCount} locations unassigned",
            id, locations.Count);
    }

    public async Task<int> ReactivateExpiredEventsAsync(List<int> eventIds)
    {
        int reactivated = 0;
        foreach (var eventId in eventIds)
        {
            var eventEntity = await _eventRepository.GetEventByIdAsync(eventId);
            if (eventEntity == null || !eventEntity.IsExpired) continue;

            var activeLocations = await _locationRepository.GetLocationsByEventIdAsync(eventId, activeOnly: true);
            if (activeLocations.Count == 0) continue;

            eventEntity.IsExpired = false;
            eventEntity.ExpiresAt = activeLocations.Max(l => l.ExpiresAt);
            await _eventRepository.UpdateEventAsync(eventEntity);
            reactivated++;

            _logger.LogInformation("Reactivated event {EventId} ({Name}) with {Count} active locations",
                eventId, eventEntity.Name, activeLocations.Count);
        }
        return reactivated;
    }
}
