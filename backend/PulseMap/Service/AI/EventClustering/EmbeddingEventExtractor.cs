using OpenAI.Embeddings;
using PulseMap.Domain;
using PulseMap.Interfaces;

namespace PulseMap.Service.AI.EventClustering;

public class EmbeddingEventExtractor : IEventExtractorService
{
    private readonly EmbeddingClient _embeddingClient;
    private readonly ILogger<EmbeddingEventExtractor> _logger;
    private readonly IAIStatisticsService _statisticsService;
    private readonly IEventRepository _eventRepository;

    private const float SIMILARITY_THRESHOLD = 0.75f; 

    public EmbeddingEventExtractor(
        IConfiguration config,
        ILogger<EmbeddingEventExtractor> logger,
        IAIStatisticsService statisticsService,
        IEventRepository eventRepository)
    {
        _logger = logger;
        _statisticsService = statisticsService;
        _eventRepository = eventRepository;

        var apiKey = config["OpenAI:ApiKey"];
        var model = config["OpenAI:EmbeddingModel"] ?? "text-embedding-3-large";

        if (string.IsNullOrEmpty(apiKey))
        {
            var errorMsg = "OpenAI ApiKey is missing - EmbeddingEventExtractor will not work";
            _logger.LogWarning(errorMsg);
            throw new InvalidOperationException(errorMsg);
        }

        _embeddingClient = new EmbeddingClient(model, new System.ClientModel.ApiKeyCredential(apiKey));
        _logger.LogInformation("EmbeddingEventExtractor initialized with model: {Model}", model);
    }

    public async Task<EventExtractionResult> ExtractEventNameAsync(string description, CancellationToken ct)
    {
        _logger.LogInformation("\nEmbedding Event Extraction");
        _logger.LogInformation("Comparing description with existing events: {Description}",
            description.Substring(0, Math.Min(100, description.Length)));

        try
        {
            var existingEvents = await _eventRepository.GetAllEventsAsync();

            if (!existingEvents.Any())
            {
                _logger.LogInformation("No existing events to compare against");
                return new EventExtractionResult { EventName = null, Confidence = 0.0f };
            }

            var descriptionLower = description.ToLowerInvariant();
            foreach (var existingEvent in existingEvents)
            {
                if (descriptionLower.Contains(existingEvent.Name.ToLowerInvariant()))
                {
                    _logger.LogInformation("EXACT KEYWORD MATCH: Event '{EventName}' found in description (confidence: 1.00)",
                        existingEvent.Name);
                    await _statisticsService.IncrementEmbeddingEventExtractorAsync();
                    return new EventExtractionResult { EventName = existingEvent.Name, Confidence = 1.0f };
                }
            }

            _logger.LogInformation("No keyword match, trying semantic embeddings...");

            var descriptionEmbeddingResponse = await _embeddingClient.GenerateEmbeddingAsync(description, cancellationToken: ct);
            var descriptionEmbedding = descriptionEmbeddingResponse.Value.ToFloats();

            var bestMatch = new { EventName = (string?)null, Similarity = 0.0 };

            foreach (var existingEvent in existingEvents)
            {
                var contextualEventName = $"event {existingEvent.Name} location activity";
                var eventEmbeddingResponse = await _embeddingClient.GenerateEmbeddingAsync(contextualEventName, cancellationToken: ct);
                var eventEmbedding = eventEmbeddingResponse.Value.ToFloats();

                var similarity = CosineSimilarity(descriptionEmbedding.Span, eventEmbedding.Span);

                _logger.LogDebug("Event '{EventName}' similarity: {Similarity:F4}", existingEvent.Name, similarity);

                if (similarity > bestMatch.Similarity)
                {
                    bestMatch = new { EventName = existingEvent.Name, Similarity = similarity };
                }
            }

            if (bestMatch.Similarity >= SIMILARITY_THRESHOLD)
            {
                _logger.LogInformation("Matched existing event: {EventName} (similarity: {Similarity:F4})",
                    bestMatch.EventName, bestMatch.Similarity);

                await _statisticsService.IncrementEmbeddingEventExtractorAsync();

                return new EventExtractionResult 
                { 
                    EventName = bestMatch.EventName, 
                    Confidence = (float)bestMatch.Similarity 
                };
            }

            _logger.LogInformation("No existing event matched (best similarity: {Similarity:F4})", bestMatch.Similarity);
            return new EventExtractionResult { EventName = null, Confidence = 0.0f };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Embedding event extraction failed");
            throw;
        }
    }

    private static double CosineSimilarity(ReadOnlySpan<float> vec1, ReadOnlySpan<float> vec2)
    {
        if (vec1.Length != vec2.Length)
            throw new ArgumentException("Vectors must have the same length");

        double dotProduct = 0;
        double magnitude1 = 0;
        double magnitude2 = 0;

        for (int i = 0; i < vec1.Length; i++)
        {
            dotProduct += vec1[i] * vec2[i];
            magnitude1 += vec1[i] * vec1[i];
            magnitude2 += vec2[i] * vec2[i];
        }

        if (magnitude1 == 0 || magnitude2 == 0)
            return 0;

        return dotProduct / (Math.Sqrt(magnitude1) * Math.Sqrt(magnitude2));
    }
}
