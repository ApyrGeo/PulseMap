namespace PulseMap.Interfaces;

public interface IRecommendationAiScorer
{
    Task<Dictionary<int, double>> ScoreCandidatesByProfileAsync(
        IReadOnlyList<string> likedDescriptions,
        IReadOnlyList<(int LocationId, string Description)> candidateDescriptions,
        CancellationToken ct = default);
}
