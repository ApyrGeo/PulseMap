using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PulseMap.Interfaces;

namespace PulseMap.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AIController : ControllerBase
    {
        private readonly ILocationClassifier _locationClassifier;
        private readonly ILocationMatcher _locationMatcher;
        private readonly ILocationService _locationService;

        public AIController(
            ILocationClassifier locationClassifier, 
            ILocationMatcher locationMatcher,
            ILocationService locationService)
        {
            _locationClassifier = locationClassifier;
            _locationMatcher = locationMatcher;
            _locationService = locationService;
        }

        [HttpPost("classify-location")]
        public async Task<IActionResult> ClassifyLocation(
            [FromBody] ClassifyRequest request,
            CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.Description))
                return BadRequest(new { error = "Description is required" });

            var categories = await _locationClassifier.ClassifyLocationAsync(request.Description, ct);

            return Ok(new { categories });
        }

        [HttpPost("match-locations")]
        public async Task<IActionResult> MatchLocations(
            [FromBody] MatchLocationsRequest request,
            CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(request.Description1))
                return BadRequest(new { error = "Description1 is required" });

            if (string.IsNullOrWhiteSpace(request.Description2))
                return BadRequest(new { error = "Description2 is required" });

            var result = await _locationMatcher.MatchLocationsAsync(request.Description1, request.Description2, ct);

            return Ok(new 
            { 
                result = result.ToString(),
                shouldMerge = result == LocationMatchResult.SameLocation
            });
        }

        [HttpPost("check-and-merge-duplicates")]
        public async Task<IActionResult> CheckAndMergeDuplicates(
            [FromQuery] double maxDistanceMeters = 20,
            CancellationToken ct = default)
        {
            var pairs = await _locationService.GetNearbyLocationPairsAsync(maxDistanceMeters);

            if (pairs.Count == 0)
            {
                return Ok(new { message = "No nearby location pairs found", mergedCount = 0 });
            }

            var mergedCount = 0;
            var results = new List<object>();

            foreach (var (loc1Id, loc2Id, distance) in pairs)
            {
                var location1 = await _locationService.GetLocationByIdAsync(loc1Id);
                var location2 = await _locationService.GetLocationByIdAsync(loc2Id);

                if (location1 == null || location2 == null)
                    continue;

                var matchResult = await _locationMatcher.MatchLocationsAsync(
                    location1.Description, 
                    location2.Description, 
                    ct);

                if (matchResult == LocationMatchResult.SameLocation)
                {
                    await _locationService.MergeLocationsAsync(loc1Id, loc2Id);
                    mergedCount++;

                    results.Add(new
                    {
                        action = "merged",
                        keptLocationId = loc1Id,
                        removedLocationId = loc2Id,
                        distance = $"{distance:F2}m",
                        matchResult = matchResult.ToString()
                    });
                }
                else
                {
                    results.Add(new
                    {
                        action = "ignored",
                        location1Id = loc1Id,
                        location2Id = loc2Id,
                        distance = $"{distance:F2}m",
                        matchResult = matchResult.ToString()
                    });
                }
            }

            return Ok(new 
            { 
                message = $"Checked {pairs.Count} pairs, merged {mergedCount} duplicates",
                mergedCount,
                results
            });
        }

        [HttpPost("force-merge")]
        public async Task<IActionResult> ForceMergeLocations(
            [FromBody] ForceMergeRequest request,
            CancellationToken ct = default)
        {
            if (request.KeepLocationId <= 0)
                return BadRequest(new { error = "KeepLocationId must be a positive integer" });

            if (request.RemoveLocationId <= 0)
                return BadRequest(new { error = "RemoveLocationId must be a positive integer" });

            if (request.KeepLocationId == request.RemoveLocationId)
                return BadRequest(new { error = "Cannot merge a location with itself" });

            var result = await _locationService.MergeLocationsAsync(
                request.KeepLocationId, 
                request.RemoveLocationId);

            if (result)
            {
                return Ok(new
                {
                    message = "Locations merged successfully",
                    keptLocationId = request.KeepLocationId,
                    removedLocationId = request.RemoveLocationId
                });
            }

            return StatusCode(500, new { error = "Merge operation failed" });
        }
    }

    public record ClassifyRequest(string Description);
    public record MatchLocationsRequest(string Description1, string Description2);
    public record ForceMergeRequest(int KeepLocationId, int RemoveLocationId);
}

