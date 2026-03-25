using PulseMap.Domain.DTOs;

namespace PulseMap.Interfaces;

public interface IInteractionService
{
    Task<InteractionResponseDTO> RecordInteractionAsync(InteractionPostDTO dto);
    Task<List<InteractionResponseDTO>> GetUserInteractionsAsync(int userId);
    Task<List<UserInteractionStatsDTO>> GetLeaderboardAsync(int take = 10);
    Task<List<LocationInteractionStatsDTO>> GetTopLocationsAsync(int take = 10);
}
