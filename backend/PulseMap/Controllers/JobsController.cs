using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PulseMap.Service.BackgroundServices;

namespace PulseMap.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class JobsController(IBackgroundJobClient backgroundJobClient) : ControllerBase
{
    private readonly IBackgroundJobClient _backgroundJobClient = backgroundJobClient;

    [HttpPost("check-expired-locations")]
    [ProducesResponseType(200)]
    public IActionResult TriggerCheckExpiredLocations()
    {
        _backgroundJobClient.Enqueue<LocationBackGroundService>(x => x.CheckExpiredLocations());
        return Ok(new { jobId = "check-expired-locations" });
    }

    [HttpPost("check-expired-events")]
    [ProducesResponseType(200)]
    public IActionResult TriggerCheckExpiredEvents()
    {
        _backgroundJobClient.Enqueue<LocationBackGroundService>(x => x.CheckExpiredEvents());
        return Ok(new { jobId = "check-expired-events" });
    }

    [HttpPost("extend-duration-by-likes")]
    [ProducesResponseType(200)]
    public IActionResult TriggerExtendDurationByLikes()
    {
        _backgroundJobClient.Enqueue<LocationBackGroundService>(x => x.ExtendLocationDurationByLikeCounts());
        return Ok(new { jobId = "extend-duration-by-likes" });
    }

    [HttpPost("check-merge-duplicate-locations")]
    [ProducesResponseType(200)]
    public IActionResult TriggerCheckMergeDuplicates()
    {
        _backgroundJobClient.Enqueue<LocationBackGroundService>(x => x.CheckAndMergeDuplicateLocations());
        return Ok(new { jobId = "check-merge-duplicate-locations" });
    }

    [HttpPost("analyze-and-cluster-events")]
    [ProducesResponseType(200)]
    public IActionResult TriggerAnalyzeAndClusterEvents()
    {
        _backgroundJobClient.Enqueue<LocationBackGroundService>(x => x.AnalyzeAndClusterEvents(100));
        return Ok(new { jobId = "analyze-and-cluster-events" });
    }
}
