namespace PulseMap.Interfaces;

public record EventExtractionResult
{
    public string? EventName { get; set; }
    public float Confidence { get; set; }
}

public interface IEventExtractorService
{
    Task<EventExtractionResult> ExtractEventNameAsync(string description, CancellationToken ct);
}
