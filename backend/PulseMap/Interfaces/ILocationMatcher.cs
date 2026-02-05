namespace PulseMap.Interfaces;

public enum LocationMatchResult
{
    SameLocation,
    PossiblySameLocation,
    DifferentLocation
}

public interface ILocationMatcher
{
    Task<LocationMatchResult> MatchLocationsAsync(string description1, string description2, CancellationToken ct);
}
