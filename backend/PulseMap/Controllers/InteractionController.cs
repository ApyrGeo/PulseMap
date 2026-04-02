using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;

namespace PulseMap.Controllers;

[Route("api/[controller]")]
[ApiController]
public class InteractionController(IInteractionService interactionService) : ControllerBase
{
    private readonly IInteractionService _interactionService = interactionService;

    [HttpPost]
    [Authorize(Roles = "User,Admin")]
    [ProducesResponseType(201)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<InteractionResponseDTO>> RecordInteraction([FromBody] InteractionPostDTO dto)
    {
        var result = await _interactionService.RecordInteractionAsync(dto);
        return StatusCode(201, result);
    }

    [HttpGet("user/{userId}")]
    [Authorize(Roles = "User,Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<List<InteractionResponseDTO>>> GetUserInteractions(int userId)
    {
        var result = await _interactionService.GetUserInteractionsAsync(userId);
        return Ok(result);
    }

    [HttpGet("user/{userId}/interacted-location-ids")]
    [Authorize(Roles = "User,Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<List<int>>> GetInteractedLocationIds(int userId)
    {
        var result = await _interactionService.GetInteractedLocationIdsAsync(userId);
        return Ok(result);
    }

    [HttpGet("leaderboard")]
    [AllowAnonymous]
    [ProducesResponseType(200)]
    public async Task<ActionResult<List<UserInteractionStatsDTO>>> GetLeaderboard([FromQuery] int take = 10)
    {
        var result = await _interactionService.GetLeaderboardAsync(take);
        return Ok(result);
    }

    [HttpGet("top-locations")]
    [AllowAnonymous]
    [ProducesResponseType(200)]
    public async Task<ActionResult<List<LocationInteractionStatsDTO>>> GetTopLocations([FromQuery] int take = 10)
    {
        var result = await _interactionService.GetTopLocationsAsync(take);
        return Ok(result);
    }
}
