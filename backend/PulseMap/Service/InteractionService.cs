using Backend.Exceptions.Custom;
using PulseMap.Domain;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;

namespace PulseMap.Service;

public class InteractionService(
    IInteractionRepository interactionRepository,
    ILocationRepository locationRepository,
    IUserRepository userRepository) : IInteractionService
{
    private readonly IInteractionRepository _interactionRepository = interactionRepository;
    private readonly ILocationRepository _locationRepository = locationRepository;
    private readonly IUserRepository _userRepository = userRepository;

    public async Task<InteractionResponseDTO> RecordInteractionAsync(InteractionPostDTO dto)
    {
        var location = await _locationRepository.GetLocationByIdAsync(dto.LocationId)
            ?? throw new NotFoundException($"Location {dto.LocationId} not found");

        var alreadyInteracted = await _interactionRepository.HasUserInteractedAsync(dto.UserId, dto.LocationId);
        if (alreadyInteracted)
            throw new ConflictException($"User {dto.UserId} already interacted with location {dto.LocationId}");

        var interaction = new Interaction
        {
            Id = 0,
            UserId = dto.UserId,
            LocationId = dto.LocationId,
            InteractedAt = DateTime.UtcNow,
            Type = dto.Type
        };

        var added = await _interactionRepository.AddInteractionAsync(interaction);
        await _interactionRepository.SaveChangesAsync();

        return new InteractionResponseDTO
        {
            Id = added.Id,
            UserId = added.UserId,
            LocationId = added.LocationId,
            LocationName = location.Name,
            InteractedAt = added.InteractedAt,
            Type = added.Type
        };
    }

    public async Task<List<int>> GetInteractedLocationIdsAsync(int userId)
    {
        return await _interactionRepository.GetInteractedLocationIdsByUserIdAsync(userId);
    }

    public async Task<List<InteractionResponseDTO>> GetUserInteractionsAsync(int userId)
    {
        var interactions = await _interactionRepository.GetInteractionsByUserIdAsync(userId);
        return interactions.Select(i => new InteractionResponseDTO
        {
            Id = i.Id,
            UserId = i.UserId,
            LocationId = i.LocationId,
            LocationName = i.Location?.Name ?? "Unknown",
            InteractedAt = i.InteractedAt,
            Type = i.Type
        }).ToList();
    }

    public async Task<List<UserInteractionStatsDTO>> GetLeaderboardAsync(int take = 10)
    {
        var topUsers = await _interactionRepository.GetTopUsersByInteractionsAsync(take);
        var result = new List<UserInteractionStatsDTO>();

        foreach (var (userId, count) in topUsers)
        {
            var user = await _userRepository.GetUserByIdAsync(userId);
            if (user == null) continue;
            result.Add(new UserInteractionStatsDTO
            {
                UserId = user.Id,
                Username = user.UserName,
                FirstName = user.FirstName,
                LastName = user.LastName,
                TotalInteractions = count
            });
        }

        return result;
    }

    public async Task<List<LocationInteractionStatsDTO>> GetTopLocationsAsync(int take = 10)
    {
        var topLocations = await _interactionRepository.GetTopLocationsByInteractionsAsync(take);
        var result = new List<LocationInteractionStatsDTO>();

        foreach (var (locationId, count) in topLocations)
        {
            var location = await _locationRepository.GetLocationByIdAsync(locationId);
            if (location == null) continue;
            result.Add(new LocationInteractionStatsDTO
            {
                LocationId = location.Id,
                LocationName = location.Name,
                TotalInteractions = count,
                Latitude = location.Latitude,
                Longitude = location.Longitude
            });
        }

        return result;
    }
}
