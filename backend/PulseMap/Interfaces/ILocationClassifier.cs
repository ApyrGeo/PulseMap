namespace PulseMap.Interfaces;

public interface ILocationClassifier
{
    Task<List<string>> ClassifyLocationAsync(string description, CancellationToken ct);
}
