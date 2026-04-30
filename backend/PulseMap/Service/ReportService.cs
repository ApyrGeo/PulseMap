using Backend.Exceptions.Custom;
using PulseMap.Domain;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;

namespace PulseMap.Service;

public class ReportService(
    IReportRepository reportRepository,
    ILocationRepository locationRepository) : IReportService
{
    private readonly IReportRepository _reportRepository = reportRepository;
    private readonly ILocationRepository _locationRepository = locationRepository;

    public async Task<ReportResponseDTO> ReportLocationAsync(ReportPostDTO dto)
    {
        var location = await _locationRepository.GetLocationByIdAsync(dto.LocationId)
            ?? throw new NotFoundException($"Location {dto.LocationId} not found");

        var alreadyReported = await _reportRepository.HasUserReportedAsync(dto.UserId, dto.LocationId);
        if (alreadyReported)
            throw new ConflictException($"User {dto.UserId} already reported location {dto.LocationId}");

        var report = new Report
        {
            UserId = dto.UserId,
            LocationId = dto.LocationId,
            Type = dto.Type,
            CreatedAt = DateTime.UtcNow
        };

        var added = await _reportRepository.AddReportAsync(report);
        await _reportRepository.SaveChangesAsync();

        return new ReportResponseDTO
        {
            Id = added.Id,
            UserId = added.UserId,
            LocationId = added.LocationId,
            Type = added.Type,
            CreatedAt = added.CreatedAt
        };
    }

    public async Task<int> GetReportCountAsync(int locationId)
    {
        return await _reportRepository.GetReportCountByLocationIdAsync(locationId);
    }
}
