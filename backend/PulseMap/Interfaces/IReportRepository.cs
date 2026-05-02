using PulseMap.Domain;

namespace PulseMap.Interfaces;

public interface IReportRepository
{
    Task<Report> AddReportAsync(Report report);
    Task<bool> HasUserReportedAsync(int userId, int locationId);
    Task<int> GetReportCountByLocationIdAsync(int locationId);
    Task<Dictionary<int, int>> GetReportCountsByLocationIdsAsync(IEnumerable<int> locationIds);
    Task SaveChangesAsync();
}
