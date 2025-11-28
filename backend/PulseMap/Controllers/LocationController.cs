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
    public async Task<ActionResult<List<LocationResponseDTO>>> GetAllLocations([FromQuery] bool active = true)
    {
        var locations = active ? await _locationService.GetActiveLocationsAsync() : await _locationService.GetAllLocationsAsync();
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
}
