using Microsoft.EntityFrameworkCore;
using PulseMap.Context;

namespace PulseMap.BackgroundServices;

public class LocationExpirationService(PulseMapContext dbContext)
{
    private readonly PulseMapContext _context = dbContext;

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
}
