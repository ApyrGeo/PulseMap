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
}
