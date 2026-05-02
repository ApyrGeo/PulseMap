namespace PulseMap.Domain.DTOs;

public record FeaturedLocationDTO(int Id, string Name, List<string> ImageUrls, int LikesCount, string? CreatorUsername);
