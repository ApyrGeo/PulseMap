using PulseMap.Domain.Enums;

namespace PulseMap.Domain;

public class User
{
    public required int Id { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string UserName { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }

    public List<Location>? PlacedLocations { get; set; } = [];
    public List<Message>? SentMessages { get; set; } = [];

    public List<Location> LikedLocations { get; set; } = [];
    public List<Location> OwnedLocations { get; set; } = [];

    public required UserRole Role { get; set; }

}
