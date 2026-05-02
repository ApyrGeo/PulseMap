using Microsoft.EntityFrameworkCore;
using PulseMap.Context;
using PulseMap.Domain;
using PulseMap.Interfaces;
using PulseMap.Service.WS;

namespace PulseMap.Service.BackgroundServices;

public class LocationBackGroundService(
    PulseMapContext dbContext,
    ILocationService locationService,
    ILocationMatcher locationMatcher,
    IEventClusteringService eventClusteringService,
    IWebSocketNotificationService webSocketNotificationService,
    ILogger<LocationBackGroundService> logger)
{
    private readonly PulseMapContext _context = dbContext;
    private readonly ILocationService _locationService = locationService;
    private readonly ILocationMatcher _locationMatcher = locationMatcher;
    private readonly IEventClusteringService _eventClusteringService = eventClusteringService;
    private readonly IWebSocketNotificationService _wsNotifier = webSocketNotificationService;
    private readonly ILogger<LocationBackGroundService> _logger = logger;

    public async Task CheckExpiredLocations()
    {
        var now = DateTime.UtcNow;

        var expiredLocations = await _context.Locations
            .Where(l => !l.IsExpired && l.ExpiresAt <= now)
            .ToListAsync();

        foreach (var location in expiredLocations)
            location.IsExpired = true;

        await _context.SaveChangesAsync();
    }

    public async Task CheckExpiredEvents()
    {
        var now = DateTime.UtcNow;

        var eventsToExpire = await _context.Events
            .Where(e => !e.IsExpired)
            .Include(e => e.Locations)
            .Where(e => e.ExpiresAt <= now || !e.Locations.Any(l => !l.IsExpired))
            .ToListAsync();

        foreach (var eventEntity in eventsToExpire)
        {
            eventEntity.IsExpired = true;
            if (eventEntity.ExpiresAt > now)
            {
                eventEntity.ExpiresAt = now;
            }
        }

        if (eventsToExpire.Count > 0)
        {
            _logger.LogInformation("Expired {Count} events with no active locations or passed expiry", eventsToExpire.Count);
            await _context.SaveChangesAsync();
        }
    }

    public async Task ExtendLocationDurationByLikeCounts()
    {
        // Formula: Δt = K × [(L_new − w_r × R_new) − E] / ln(1 + N)
        // t' = (t + Δt) × e^{−λ × Δh/24}, clamped to [MinDays, MaxDays]
        // Instant expiry if R_total ≥ 5 AND R_total > L_total × 0.5
        const double L = 0.01;       // baseline: expected likes per user per day
        const double K = 0.5;        // activity sensitivity weight
        const double Wr = 3.0;       // report penalty: 1 report = -3 virtual likes
        const double Lambda = 0.05;  // daily exponential decay rate
        const double MinDays = 0.1;
        const double MaxDays = 14;

        int totalUsers = await _context.Users.CountAsync();

        var locations = await _context.Locations
            .Where(l => !l.IsExpired && l.Owner == null)
            .Include(l => l.Likes)
            .ToListAsync();

        var locationIds = locations.Select(l => l.Id).ToList();

        var reportCounts = await _context.Reports
            .Where(r => locationIds.Contains(r.LocationId))
            .GroupBy(r => r.LocationId)
            .Select(g => new { LocationId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.LocationId, x => x.Count);

        var modifiedLocationIds = new List<int>();

        foreach (var location in locations)
        {
            var remainingTime = location.ExpiresAt - DateTime.UtcNow;

            var prevLikeStatus = await _context.LikeStatuses
                .Where(l => l.LocationId == location.Id)
                .SingleOrDefaultAsync();

            int currentLikeCount = location.Likes.Count;
            int currentReportCount = reportCounts.GetValueOrDefault(location.Id, 0);

            if (prevLikeStatus != null)
            {
                var newLikes = currentLikeCount - prevLikeStatus.PreviousLikeCount;
                var newReports = currentReportCount - prevLikeStatus.PreviousReportCount;
                var hoursSinceLastCheck = (DateTime.UtcNow - prevLikeStatus.LastChecked).TotalHours;

                // Instant expiry: location heavily reported relative to likes
                if (currentReportCount >= 5 && currentReportCount > currentLikeCount * 0.5)
                {
                    location.IsExpired = true;
                    modifiedLocationIds.Add(location.Id);
                    _logger.LogInformation(
                        "Location {Id} flagged for expiry: {Reports} reports vs {Likes} likes",
                        location.Id, currentReportCount, currentLikeCount);
                }
                else
                {
                    var expectedLikes = totalUsers * L * (hoursSinceLastCheck / 24.0);
                    var denominator = Math.Log(1 + totalUsers);
                    var deltaDays = K * ((newLikes - Wr * newReports) - expectedLikes) / denominator;

                    remainingTime = remainingTime.Add(TimeSpan.FromDays(deltaDays));
                    var decayFactor = Math.Exp(-Lambda * (hoursSinceLastCheck / 24.0));
                    remainingTime = TimeSpan.FromTicks((long)(remainingTime.Ticks * decayFactor));

                    if (remainingTime.TotalSeconds < 0)
                        remainingTime = TimeSpan.Zero;

                    if (remainingTime < TimeSpan.FromDays(MinDays))
                        remainingTime = TimeSpan.FromDays(MinDays);
                    else if (remainingTime > TimeSpan.FromDays(MaxDays))
                        remainingTime = TimeSpan.FromDays(MaxDays);

                    location.ExpiresAt = DateTime.UtcNow.Add(remainingTime);
                    modifiedLocationIds.Add(location.Id);
                }

                prevLikeStatus.PreviousLikeCount = currentLikeCount;
                prevLikeStatus.PreviousReportCount = currentReportCount;
                prevLikeStatus.LastChecked = DateTime.UtcNow;
                _context.LikeStatuses.Update(prevLikeStatus);
            }
            else
            {
                // First time seeing this location — apply formula using existing likes
                if (currentLikeCount > 0)
                {
                    var expectedLikes = totalUsers * L;
                    var denominator = Math.Log(1 + totalUsers);
                    var deltaDays = K * ((currentLikeCount - Wr * currentReportCount) - expectedLikes) / denominator;

                    remainingTime = remainingTime.Add(TimeSpan.FromDays(deltaDays));

                    if (remainingTime.TotalSeconds < 0)
                        remainingTime = TimeSpan.Zero;
                    if (remainingTime < TimeSpan.FromDays(MinDays))
                        remainingTime = TimeSpan.FromDays(MinDays);
                    else if (remainingTime > TimeSpan.FromDays(MaxDays))
                        remainingTime = TimeSpan.FromDays(MaxDays);

                    location.ExpiresAt = DateTime.UtcNow.Add(remainingTime);
                    modifiedLocationIds.Add(location.Id);
                }

                var newLikeStatus = new LikeStatus
                {
                    LocationId = location.Id,
                    Location = location,
                    PreviousLikeCount = currentLikeCount,
                    PreviousReportCount = currentReportCount,
                    LastChecked = DateTime.UtcNow
                };
                await _context.LikeStatuses.AddAsync(newLikeStatus);
            }
        }

        await _context.SaveChangesAsync();

        foreach (var id in modifiedLocationIds)
        {
            try
            {
                var dto = await _locationService.GetLocationByIdAsync(id);
                await _wsNotifier.BroadcastJsonAsync(new WebSocketPayload
                {
                    EntityType = PayloadEntityType.Location,
                    ActionType = PayloadActionType.Updated,
                    Data = dto
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to broadcast WS update for location {Id}", id);
            }
        }
    }

    public async Task AnalyzeAndClusterEvents(double maxDistanceMeters = 100)
    {
        _logger.LogInformation("Starting automatic event clustering (maxDistance={Max}m)", maxDistanceMeters);

        var activeLocations = await _context.Locations
            .Where(l => !l.IsExpired)
            .Include(l => l.Likes)
            .Include(l => l.Owner)
            .Include(l => l.Creator)
            .ToListAsync();

        if (activeLocations.Count == 0)
        {
            _logger.LogInformation("No active locations found for event clustering");
            return;
        }

        var result = await _eventClusteringService.ClusterLocationsAsync(
            activeLocations,
            maxDistanceMeters,
            CancellationToken.None);

        _logger.LogInformation(
            "Event clustering completed: {Created} events created, {Updated} updated, {Assigned} locations assigned, {Ignored} ignored",
            result.EventsCreated.Count, result.EventsUpdated.Count,
            result.LocationsAssigned, result.LocationsIgnored);
    }

    public async Task CheckAndMergeDuplicateLocations()
    {
        _logger.LogInformation("Starting automatic duplicate location detection");

        const double maxDistanceMeters = 20;

        var pairs = await _locationService.GetNearbyLocationPairsAsync(maxDistanceMeters);

        if (pairs.Count == 0)
        {
            _logger.LogInformation("No nearby location pairs found");
            return;
        }

        _logger.LogInformation("Found {Count} location pairs to check", pairs.Count);

        var mergedCount = 0;

        foreach (var (loc1Id, loc2Id, distance) in pairs)
        {
            try
            {
                var location1 = await _locationService.GetLocationByIdAsync(loc1Id);
                var location2 = await _locationService.GetLocationByIdAsync(loc2Id);

                if (location1 == null || location2 == null)
                {
                    _logger.LogWarning("Location {Loc1} or {Loc2} not found, skipping", loc1Id, loc2Id);
                    continue;
                }

                var matchResult = await _locationMatcher.MatchLocationsAsync(
                    location1.Description,
                    location2.Description,
                    CancellationToken.None);

                if (matchResult == LocationMatchResult.SameLocation)
                {
                    _logger.LogInformation("Merging duplicate locations: {Loc1} and {Loc2} (distance: {Distance:F2}m)", 
                        loc1Id, loc2Id, distance);

                    await _locationService.MergeLocationsAsync(loc1Id, loc2Id);
                    mergedCount++;
                }
                else
                {
                    _logger.LogInformation("Locations {Loc1} and {Loc2} are not duplicates (result: {Result}, distance: {Distance:F2}m)",
                        loc1Id, loc2Id, matchResult, distance);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing location pair {Loc1} and {Loc2}", loc1Id, loc2Id);
            }
        }

        _logger.LogInformation("Automatic duplicate detection completed: checked {Total} pairs, merged {Merged} duplicates",
            pairs.Count, mergedCount);
    }
}

