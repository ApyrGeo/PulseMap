using PulseMap.Domain;

namespace PulseMap.Domain.DTOs;

public class ReportPostDTO
{
    public required int UserId { get; set; }
    public required int LocationId { get; set; }
    public required ReportType Type { get; set; }
}
