using PulseMap.Domain;

namespace PulseMap.Domain.DTOs;

public class ReportResponseDTO
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int LocationId { get; set; }
    public ReportType Type { get; set; }
    public DateTime CreatedAt { get; set; }
}
