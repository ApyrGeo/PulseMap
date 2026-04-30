using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PulseMap.Authorization;
using PulseMap.Domain.DTOs;
using PulseMap.Extensions;
using PulseMap.Interfaces;
using PulseMap.Domain;

namespace PulseMap.Controllers;

[Route("api/[controller]")]
[ApiController]
public class LocationController(ILocationService locationService, IAuthorizationService authorizationService, IEventService eventService) : ControllerBase
{
    private readonly ILocationService _locationService = locationService;
    private readonly IAuthorizationService _authorizationService = authorizationService;
    private readonly IEventService _eventService = eventService;

    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<LocationResponseDTO>> GetLocationById(int id)
    {
        var location = await _locationService.GetLocationByIdAsync(id);
        return Ok(location);
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(200)]
    public async Task<ActionResult<List<LocationResponseDTO>>> GetAllLocations([FromQuery] bool active = true, [FromQuery] int userId = 1)
    {
        var locations = active ? await _locationService.GetActiveLocationsAsync(userId) : await _locationService.GetAllLocationsAsync(userId);
        return Ok(locations);
    }

    [HttpGet("bounds")]
    [AllowAnonymous]
    [ProducesResponseType(200)]
    public async Task<ActionResult<List<LocationResponseDTO>>> GetLocationsInBounds([FromQuery] double minLat, [FromQuery] double maxLat, [FromQuery] double minLng, [FromQuery] double maxLng, [FromQuery] string? type, [FromQuery] bool active = true, [FromQuery] int userId = 1)
    {
        var locations = await _locationService.GetActiveLocationsInBoundsAsync(minLat, maxLat, minLng, maxLng, type, userId);
        return Ok(locations);
    }

    [HttpGet("recommendations/bounds")]
    [Authorize(Roles = "User,Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<List<LocationRecommendationResponseDTO>>> GetRecommendedLocationsInBounds(
        [FromQuery] double minLat,
        [FromQuery] double maxLat,
        [FromQuery] double minLng,
        [FromQuery] double maxLng,
        [FromQuery] int userId,
        [FromQuery] int count = 10)
    {
        var recommendations = await _locationService.GetRecommendedLocationsInBoundsAsync(minLat, maxLat, minLng, maxLng, userId, count);
        return Ok(recommendations);
    }

    [HttpPost]
    [Authorize(Roles = "User,Admin")]
    [ProducesResponseType(201)]
    [ProducesResponseType(401)]
    [ProducesResponseType(422)]
    public async Task<ActionResult<LocationResponseDTO>> CreateLocation([FromBody] LocationPostDTO locationPostDTO)
    {
        var addedLocation = await _locationService.AddLocationAsync(locationPostDTO);
        return CreatedAtAction(nameof(GetLocationById), new { id = addedLocation.Id }, addedLocation);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "User,Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(422)]
    public async Task<ActionResult<LocationResponseDTO>> UpdateLocation([FromRoute] int id, [FromBody] LocationPutDTO locationResponseDTO)
    {
        // Check ownership before updating
        var existingLocation = await _locationService.GetLocationByIdAsync(id);
        if (existingLocation == null)
            return NotFound();

        // Creator or owner (or admin) can update
        if (!User.IsOwnerOrAdmin(existingLocation.Owner?.Id) && !User.IsOwnerOrAdmin(existingLocation.Creator?.Id))
            return Forbid();

        var updatedLocation = await _locationService.UpdateLocationAsync(locationResponseDTO, id);
        return Ok(updatedLocation);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(204)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult> DeleteLocation(int id)
    {
        await _locationService.DeleteLocationAsync(id);
        return NoContent();
    }

    [HttpPatch("{id}/expire")]
    [Authorize(Roles = "User,Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult<LocationResponseDTO>> ExpireLocation(int id)
    {
        // Check ownership before expiring
        var existingLocation = await _locationService.GetLocationByIdAsync(id);
        if (existingLocation == null)
            return NotFound();

        // Creator or owner (or admin) can expire
        if (!User.IsOwnerOrAdmin(existingLocation.Owner?.Id) && !User.IsOwnerOrAdmin(existingLocation.Creator?.Id))
            return Forbid();

        var updatedLocation = await _locationService.ExpireLocationAsync(id);
        return Ok(updatedLocation);
    }

    [HttpPatch("{id}/extend")]
    [Authorize(Roles = "User,Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult<LocationResponseDTO>> ExtendLocationExpiration(int id)
    {
        // Check ownership before extending
        var existingLocation = await _locationService.GetLocationByIdAsync(id);
        if (existingLocation == null)
            return NotFound();

        // Creator or owner (or admin) can extend
        if (!User.IsOwnerOrAdmin(existingLocation.Owner?.Id) && !User.IsOwnerOrAdmin(existingLocation.Creator?.Id))
            return Forbid();

        var updatedLocation = await _locationService.ExtendLocationExpirationAsync(id);
        return Ok(updatedLocation);
    }

    [HttpPatch("{locationId}/like")]
    [Authorize(Roles = "User,Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<LocationResponseDTO>> LikeLocation([FromRoute] int locationId, [FromQuery] int userId)
    {
        var updatedLocation = await _locationService.LikeLocationAsync(locationId, userId);
        return Ok(updatedLocation);
    }

    [HttpGet("needs-review")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    public async Task<ActionResult<List<LocationResponseDTO>>> GetLocationsNeedingReview([FromQuery] int? eventId = null)
    {
        var locations = await _locationService.GetLocationsNeedingReviewAsync(eventId);
        return Ok(locations);
    }

    [HttpPatch("{locationId}/confirm-event")]
    [Authorize(Roles = "User,Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<LocationResponseDTO>> ConfirmLocationEvent(int locationId)
    {
        var existingLocation = await _locationService.GetLocationByIdAsync(locationId);
        if (existingLocation == null)
            return NotFound();

        if (!User.IsOwnerOrAdmin(existingLocation.Owner?.Id) && !User.IsOwnerOrAdmin(existingLocation.Creator?.Id))
            return Forbid();

        var updatedLocation = await _locationService.ConfirmLocationEventAsync(locationId);
        return Ok(updatedLocation);
    }

    [HttpPatch("{locationId}/reject-event")]
    [Authorize(Roles = "User,Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<LocationResponseDTO>> RejectLocationEvent(int locationId)
    {
        var existingLocation = await _locationService.GetLocationByIdAsync(locationId);
        if (existingLocation == null)
            return NotFound();

        if (!User.IsOwnerOrAdmin(existingLocation.Owner?.Id) && !User.IsOwnerOrAdmin(existingLocation.Creator?.Id))
            return Forbid();

        var updatedLocation = await _locationService.RejectLocationEventAsync(locationId);
        return Ok(updatedLocation);
    }

    [HttpPatch("{id}/star")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<LocationResponseDTO>> ToggleStar(int id)
    {
        var result = await _locationService.ToggleStarAsync(id);
        return Ok(result);
    }

    [HttpGet("starred")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<List<LocationResponseDTO>>> GetStarred()
    {
        var result = await _locationService.GetStarredLocationsAsync();
        return Ok(result);
    }

    [HttpPost("seed-starred")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<SeedResultDTO>> SeedStarred()
    {
        var newLocations = await _locationService.SeedStarredLocationsAsync();
        if (newLocations.Count == 0)
            return Ok(new SeedResultDTO { LocationsSeeded = 0, EventsCreated = 0, EventsUpdated = 0 });

        var eventIds = newLocations
            .Where(l => l.EventId.HasValue)
            .Select(l => l.EventId!.Value)
            .Distinct()
            .ToList();

        var reactivated = eventIds.Count > 0
            ? await _eventService.ReactivateExpiredEventsAsync(eventIds)
            : 0;

        return Ok(new SeedResultDTO
        {
            LocationsSeeded = newLocations.Count,
            EventsCreated = 0,
            EventsUpdated = reactivated
        });
    }
}
