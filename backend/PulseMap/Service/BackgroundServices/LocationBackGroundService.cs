using Microsoft.EntityFrameworkCore;
using PulseMap.Context;
using PulseMap.Domain;

namespace PulseMap.Service.BackgroundServices;

public class LocationBackGroundService(PulseMapContext dbContext)
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

    public async Task ExtendLocationDurationByLikeCounts()
    {
        const double L = 0.01;
        const double K = 0.5;       
        const double Lambda = 0.05; 
        const double MinDays = 0.1; 
        const double MaxDays = 14;

        int totalUsers = await _context.Users.CountAsync();

        var locations = await _context.Locations
            .Where(l => !l.IsExpired)
            .Include(l => l.Likes)
            .ToListAsync();

        foreach (var location in locations)
        {
            var remainingTime = location.ExpiresAt - DateTime.UtcNow;

            var prevLikeStatus = await _context.LikeStatuses
                .Where(l => l.LocationId == location.Id)
                .SingleOrDefaultAsync();

            int currentLikeCount = location.Likes.Count;
            int previousLikeCount = 0;

            if (prevLikeStatus != null)
            {
                previousLikeCount = prevLikeStatus.PreviousLikeCount;

                var newLikes = currentLikeCount - previousLikeCount;

                var hoursSinceLastCheck = (DateTime.UtcNow - prevLikeStatus.LastChecked).TotalHours;

                var expectedLikes = totalUsers * L * (hoursSinceLastCheck / 24.0);

                var denominator = Math.Log(1 + totalUsers);

                var deltaDays = K * (newLikes - expectedLikes) / denominator;

                remainingTime = remainingTime.Add(TimeSpan.FromDays(deltaDays));

                var decayFactor = Math.Exp(-Lambda * (hoursSinceLastCheck / 24.0)); 

                remainingTime = TimeSpan.FromTicks((long)(remainingTime.Ticks * decayFactor));


                if (remainingTime.TotalSeconds < 0)
                    remainingTime = TimeSpan.Zero;

                if (remainingTime < TimeSpan.FromDays(MinDays))
                {
                    remainingTime = TimeSpan.FromDays(MinDays);
                }
                else if (remainingTime > TimeSpan.FromDays(MaxDays))
                {
                    remainingTime = TimeSpan.FromDays(MaxDays);
                }

                location.ExpiresAt = DateTime.UtcNow.Add(remainingTime);
                prevLikeStatus.PreviousLikeCount = currentLikeCount;
                prevLikeStatus.LastChecked = DateTime.UtcNow;
                _context.LikeStatuses.Update(prevLikeStatus);
            }
            else
            {
                var newLikeStatus = new LikeStatus
                {
                    LocationId = location.Id,
                    Location = location,
                    PreviousLikeCount = currentLikeCount,
                    LastChecked = DateTime.UtcNow
                };
                await _context.LikeStatuses.AddAsync(newLikeStatus);
            }
        }
    }
}
