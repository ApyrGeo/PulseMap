using PulseMap.Domain.DTOs;

namespace PulseMap.Interfaces;

public interface IReportService
{
    Task<ReportResponseDTO> ReportLocationAsync(ReportPostDTO dto);
    Task<int> GetReportCountAsync(int locationId);
}
