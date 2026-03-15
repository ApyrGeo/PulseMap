using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;

namespace PulseMap.Controllers;

[Route("api/[controller]")]
[ApiController]
public class EventController : ControllerBase
{
    private readonly IEventService _eventService;
    private readonly ILogger<EventController> _logger;

    public EventController(IEventService eventService, ILogger<EventController> logger)
    {
        _eventService = eventService;
        _logger = logger;
    }

    [Authorize(Roles = "Admin,User")]
    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<EventResponseDTO>> GetEventById(int id, [FromQuery] bool includeLocations = false)
    {
        var eventDto = await _eventService.GetEventByIdAsync(id, includeLocations);
        return Ok(eventDto);
    }

    [Authorize(Roles = "Admin,User")]
    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<ActionResult<List<EventResponseDTO>>> GetAllEvents([FromQuery] bool active = true)
    {
        var events = await _eventService.GetAllEventsAsync(active);
        return Ok(events);
    }

    [Authorize(Roles = "Admin,User")]
    [HttpGet("bounds")]
    [ProducesResponseType(200)]
    public async Task<ActionResult<List<EventResponseDTO>>> GetEventsInBounds(
        [FromQuery] double minLat,
        [FromQuery] double maxLat,
        [FromQuery] double minLng,
        [FromQuery] double maxLng,
        [FromQuery] bool active = true,
        [FromQuery] bool includeLocations = false)
    {
        var events = await _eventService.GetEventsInBoundsAsync(minLat, maxLat, minLng, maxLng, active, includeLocations);
        return Ok(events);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("analyze")]
    [ProducesResponseType(200)]
    public async Task<ActionResult<EventClusteringResultDTO>> AnalyzeAndClusterLocations(
        [FromQuery] double maxDistance = 100,
        CancellationToken ct = default)
    {
        _logger.LogInformation("Received request to analyze and cluster locations (maxDistance: {Distance}m)", maxDistance);
        var result = await _eventService.AnalyzeAndClusterLocationsAsync(maxDistance, ct);
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPatch("{id}/confirm")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<EventResponseDTO>> ConfirmEvent(int id)
    {
        var eventDto = await _eventService.ConfirmEventAsync(id);
        return Ok(eventDto);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<ActionResult> DeleteEvent(int id)
    {
        await _eventService.DeleteEventAsync(id);
        return NoContent();
    }
}
