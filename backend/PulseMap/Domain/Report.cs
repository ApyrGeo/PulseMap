namespace PulseMap.Domain;

public class Report
{
    public int Id { get; set; }
    public required int UserId { get; set; }
    public User? User { get; set; }
    public required int LocationId { get; set; }
    public Location? Location { get; set; }
    public required ReportType Type { get; set; }
    public required DateTime CreatedAt { get; set; }
}

public enum ReportType
{
    LocationDoesNotExist = 0,
    MisleadingInformation = 1,
    InappropriateContent = 2,
    Duplicate = 3
}
