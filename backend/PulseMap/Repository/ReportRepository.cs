using Microsoft.EntityFrameworkCore;
using PulseMap.Context;
using PulseMap.Domain;
using PulseMap.Interfaces;

namespace PulseMap.Repository;

public class ReportRepository(PulseMapContext context) : IReportRepository
{
    private readonly PulseMapContext _context = context;

    public async Task<Report> AddReportAsync(Report report)
    {
        var added = await _context.Reports.AddAsync(report);
        return added.Entity;
    }

    public async Task<bool> HasUserReportedAsync(int userId, int locationId)
    {
        return await _context.Reports
            .AnyAsync(r => r.UserId == userId && r.LocationId == locationId);
    }

    public async Task<int> GetReportCountByLocationIdAsync(int locationId)
    {
        return await _context.Reports
            .CountAsync(r => r.LocationId == locationId);
    }

    public async Task<Dictionary<int, int>> GetReportCountsByLocationIdsAsync(IEnumerable<int> locationIds)
    {
        return await _context.Reports
            .Where(r => locationIds.Contains(r.LocationId))
            .GroupBy(r => r.LocationId)
            .Select(g => new { LocationId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.LocationId, x => x.Count);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
