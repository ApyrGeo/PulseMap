using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;

namespace PulseMap.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ReportController(IReportService reportService) : ControllerBase
{
    private readonly IReportService _reportService = reportService;

    [HttpPost]
    [Authorize(Roles = "User,Admin")]
    [ProducesResponseType(201)]
    [ProducesResponseType(401)]
    [ProducesResponseType(409)]
    public async Task<ActionResult<ReportResponseDTO>> ReportLocation([FromBody] ReportPostDTO dto)
    {
        var result = await _reportService.ReportLocationAsync(dto);
        return StatusCode(201, result);
    }

    [HttpGet("location/{locationId}/count")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(200)]
    [ProducesResponseType(401)]
    public async Task<ActionResult<int>> GetReportCount(int locationId)
    {
        var count = await _reportService.GetReportCountAsync(locationId);
        return Ok(count);
    }
}
