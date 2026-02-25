using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;

namespace PulseMap.Controllers;

[Route("api/[controller]")]
[ApiController]
public class LocationController(ILocationService locationService) : ControllerBase
{
    private readonly ILocationService _locationService = locationService;

    [HttpGet("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<LocationResponseDTO>> GetLocationById(int id)
    {
        var location = await _locationService.GetLocationByIdAsync(id);
        return Ok(location);
    }

    [HttpGet]
    [ProducesResponseType(200)]
    public async Task<ActionResult<List<LocationResponseDTO>>> GetAllLocations([FromQuery] bool active = true, [FromQuery] int userId = 1)
    {
        var locations = active ? await _locationService.GetActiveLocationsAsync(userId) : await _locationService.GetAllLocationsAsync(userId);
        return Ok(locations);
    }

    [HttpGet("bounds")]
    [ProducesResponseType(200)]
    public async Task<ActionResult<List<LocationResponseDTO>>> GetLocationsInBounds([FromQuery] double minLat, [FromQuery] double maxLat, [FromQuery] double minLng, [FromQuery] double maxLng, [FromQuery] string? type, [FromQuery] bool active = true, [FromQuery] int userId = 1)
    {
        var locations = await _locationService.GetActiveLocationsInBoundsAsync(minLat, maxLat, minLng, maxLng, type, userId);
        return Ok(locations);
    }

    [HttpPost]
    [ProducesResponseType(201)]
    [ProducesResponseType(422)]
    public async Task<ActionResult<LocationResponseDTO>> CreateLocation([FromBody] LocationPostDTO locationPostDTO)
    {
        var addedLocation = await _locationService.AddLocationAsync(locationPostDTO);
        return CreatedAtAction(nameof(GetLocationById), new { id = addedLocation.Id }, addedLocation);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(200)]
    [ProducesResponseType(422)]
    public async Task<ActionResult<LocationResponseDTO>> UpdateLocation([FromRoute] int id, [FromBody] LocationPutDTO locationResponseDTO)
    {
        var updatedLocation = await _locationService.UpdateLocationAsync(locationResponseDTO, id);
        return Ok(updatedLocation);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(204)]
    public async Task<ActionResult> DeleteLocation(int id)
    {
        await _locationService.DeleteLocationAsync(id);
        return NoContent();
    }

    [HttpPatch("{id}/expire")]
    public async Task<ActionResult<LocationResponseDTO>> ExpireLocation(int id)
    {
        var updatedLocation = await _locationService.ExpireLocationAsync(id);
        return Ok(updatedLocation);
    }

    [HttpPatch("{id}/extend")]
    public async Task<ActionResult<LocationResponseDTO>> ExtendLocationExpiration(int id)
    {
        var updatedLocation = await _locationService.ExtendLocationExpirationAsync(id);
        return Ok(updatedLocation);
    }

    [HttpPatch("{locationId}/like")]
    public async Task<ActionResult<LocationResponseDTO>> LikeLocation([FromRoute] int locationId, [FromQuery] int userId)
    {
        var updatedLocation = await _locationService.LikeLocationAsync(locationId, userId);
        return Ok(updatedLocation);
    }

    [HttpGet("needs-review")]
    [ProducesResponseType(200)]
    public async Task<ActionResult<List<LocationResponseDTO>>> GetLocationsNeedingReview([FromQuery] int? eventId = null)
    {
        var locations = await _locationService.GetLocationsNeedingReviewAsync(eventId);
        return Ok(locations);
    }

    [HttpPatch("{locationId}/confirm-event")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<LocationResponseDTO>> ConfirmLocationEvent(int locationId)
    {
        var updatedLocation = await _locationService.ConfirmLocationEventAsync(locationId);
        return Ok(updatedLocation);
    }

    [HttpPatch("{locationId}/reject-event")]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<LocationResponseDTO>> RejectLocationEvent(int locationId)
    {
        var updatedLocation = await _locationService.RejectLocationEventAsync(locationId);
        return Ok(updatedLocation);
    }
}
