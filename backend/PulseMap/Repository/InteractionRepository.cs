using Microsoft.EntityFrameworkCore;
using PulseMap.Context;
using PulseMap.Domain;
using PulseMap.Interfaces;

namespace PulseMap.Repository;

public class InteractionRepository(PulseMapContext context) : IInteractionRepository
{
    private readonly PulseMapContext _context = context;

    public async Task<Interaction> AddInteractionAsync(Interaction interaction)
    {
        var added = await _context.Interactions.AddAsync(interaction);
        return added.Entity;
    }

    public async Task<bool> HasUserInteractedAsync(int userId, int locationId)
    {
        return await _context.Interactions
            .AnyAsync(i => i.UserId == userId && i.LocationId == locationId);
    }

    public async Task<List<Interaction>> GetInteractionsByUserIdAsync(int userId)
    {
        return await _context.Interactions
            .Include(i => i.Location)
            .Where(i => i.UserId == userId)
            .OrderByDescending(i => i.InteractedAt)
            .ToListAsync();
    }

    public async Task<List<(int UserId, int Count)>> GetTopUsersByInteractionsAsync(int take = 10)
    {
        return await _context.Interactions
            .GroupBy(i => i.UserId)
            .Select(g => new { UserId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(take)
            .Select(x => ValueTuple.Create(x.UserId, x.Count))
            .ToListAsync();
    }

    public async Task<List<(int LocationId, int Count)>> GetTopLocationsByInteractionsAsync(int take = 10)
    {
        return await _context.Interactions
            .GroupBy(i => i.LocationId)
            .Select(g => new { LocationId = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .Take(take)
            .Select(x => ValueTuple.Create(x.LocationId, x.Count))
            .ToListAsync();
    }

    public async Task<List<int>> GetInteractedLocationIdsByUserIdAsync(int userId)
    {
        return await _context.Interactions
            .Where(i => i.UserId == userId)
            .Select(i => i.LocationId)
            .Distinct()
            .ToListAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
