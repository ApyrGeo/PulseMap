using PulseMap.Domain;

namespace PulseMap.Interfaces;

public interface IInteractionRepository
{
    Task<Interaction> AddInteractionAsync(Interaction interaction);
    Task<bool> HasUserInteractedAsync(int userId, int locationId);
    Task<List<Interaction>> GetInteractionsByUserIdAsync(int userId);
    Task<List<(int UserId, int Count)>> GetTopUsersByInteractionsAsync(int take = 10);
    Task<List<(int LocationId, int Count)>> GetTopLocationsByInteractionsAsync(int take = 10);
    Task<List<int>> GetInteractedLocationIdsByUserIdAsync(int userId);
    Task SaveChangesAsync();
}
