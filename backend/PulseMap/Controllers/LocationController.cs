using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PulseMap.Authorization;
using PulseMap.Domain.DTOs;
using PulseMap.Extensions;
using PulseMap.Interfaces;

namespace PulseMap.Controllers;

[Route("api/[controller]")]
[ApiController]
public class LocationController(ILocationService locationService, IAuthorizationService authorizationService) : ControllerBase
{
    private readonly ILocationService _locationService = locationService;
    private readonly IAuthorizationService _authorizationService = authorizationService;

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

        // Only owner or admin can update
        if (!User.IsOwnerOrAdmin(existingLocation.Owner?.Id))
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

        // Only owner or admin can expire
        if (!User.IsOwnerOrAdmin(existingLocation.Owner?.Id))
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

        // Only owner or admin can extend
        if (!User.IsOwnerOrAdmin(existingLocation.Owner?.Id))
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
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<LocationResponseDTO>> ConfirmLocationEvent(int locationId)
    {
        var updatedLocation = await _locationService.ConfirmLocationEventAsync(locationId);
        return Ok(updatedLocation);
    }

    [HttpPatch("{locationId}/reject-event")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<LocationResponseDTO>> RejectLocationEvent(int locationId)
    {
        var updatedLocation = await _locationService.RejectLocationEventAsync(locationId);
        return Ok(updatedLocation);
    }
}
