namespace PulseMap.Domain.DTOs;

public class LocationLikesSummaryDTO
{
    public required int Id { get; set; }
    public required int LikesCount { get; set; }
    public int? ToggledByUserId { get; set; }
    public required bool IsNowLiked { get; set; }

}
