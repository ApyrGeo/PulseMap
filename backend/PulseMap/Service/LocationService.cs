using AutoMapper;
using Backend.Exceptions.Custom;
using log4net;
using PulseMap.Domain;
using PulseMap.Domain.DTOs;
using PulseMap.Domain.Enums;
using PulseMap.Interfaces;
using PulseMap.Repository;
using PulseMap.Service.WS;
using System.Text.Json;

namespace PulseMap.Service;

public class LocationService(ILocationRepository locationRepository, IUserRepository userRepository, IMapper mapper, IValidatorFactory validatorFactory, IWebSocketNotificationService webSocketNotificationService) : ILocationService
{
    private readonly ILocationRepository _locationRepository = locationRepository;
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IMapper _mapper = mapper;
    private readonly IValidatorFactory _validator = validatorFactory;
    private readonly IWebSocketNotificationService _webSocketNotificationService = webSocketNotificationService;
    private readonly ILog _logger = LogManager.GetLogger(typeof(LocationService));

    public async Task<LocationResponseDTO?> GetLocationByIdAsync(int id, int userId = 1)
    {
        _logger.InfoFormat("Getting location by ID: {0}", id);
        var location = await _locationRepository.GetLocationByIdAsync(id)
            ?? throw new NotFoundException("Location not found");

        return _mapper.Map<LocationResponseDTO>(location) with { IsLikedByCurrentUser = location.Likes.Any(l => l.Id == userId) };
    }

    public async Task<LocationResponseDTO> AddLocationAsync(LocationPostDTO locationPostDTO)
    {
        _logger.InfoFormat("Validating location");
        var validator = _validator.Get<LocationPostDTO>();
        var result = await validator.ValidateAsync(locationPostDTO);
        if (!result.IsValid)
        {
            throw new EntityValidationException(result.Errors);
        }

        _logger.InfoFormat("Adding new location: {0}", JsonSerializer.Serialize(locationPostDTO));
        var location = _mapper.Map<Location>(locationPostDTO);
        location.ExpiresAt = DateTime.UtcNow.Add(locationPostDTO.Duration);
        location.IsExpired = false;

        var addedlocation = await _locationRepository.AddLocationAsync(location);
        await _locationRepository.SaveChangesAsync();

        var addedLocationDTO = _mapper.Map<LocationResponseDTO>(addedlocation);
        await _webSocketNotificationService.BroadcastJsonAsync(new WebSocketPayload
        {
            EntityType = PayloadEntityType.Location,
            ActionType = PayloadActionType.Created,
            Data = addedLocationDTO
        });

        return addedLocationDTO;
    }

    public async Task<List<LocationResponseDTO>> GetAllLocationsAsync(int userId = 1)
    {
        _logger.Info("Getting all locations");
        var locations = await _locationRepository.GetAllLocationsAsync();
        foreach (var loc in locations)
        {
            loc.Comments = loc.Comments?
                .Where(c => c is not ResponseMessage)
                .ToList();
        }
        return [.. locations.Select(loc =>
        _mapper.Map<LocationResponseDTO>(loc) with
        {
            IsLikedByCurrentUser = loc.Likes.Any(l => l.Id == userId),
        })];
    }

    public async Task<List<LocationResponseDTO>> GetActiveLocationsAsync(int userId = 1)
    {
        _logger.Info("Getting active locations");
        var locations = await _locationRepository.GetActiveLocationsAsync();
        foreach (var loc in locations)
        {
            loc.Comments = loc.Comments?
                .Where(c => c is not ResponseMessage)
                .ToList();
        }
        return [.. locations.Select(loc =>
        _mapper.Map<LocationResponseDTO>(loc) with
        {
            IsLikedByCurrentUser = loc.Likes.Any(l => l.Id == userId),
        })];
    }

    public async Task<LocationResponseDTO?> UpdateLocationAsync(LocationPutDTO locationPutDto, int id)
    {
        _logger.InfoFormat("Updating location with ID: {0}", id);

        var existingLocation = await _locationRepository.GetLocationByIdAsync(id)
            ?? throw new NotFoundException("Location not found");

        var validator = _validator.Get<LocationPutDTO>();
        var result = await validator.ValidateAsync(locationPutDto);
        if (!result.IsValid)
        {
            throw new EntityValidationException("Invalid data for updating the location");
        }

        _logger.InfoFormat("Updating data for location with ID: {0}", id);
        if (!Enum.TryParse<Category>(locationPutDto.Category, out var category))
        {
            throw new EntityValidationException($"Invalid category value: {locationPutDto.Category}");
        }
        existingLocation.Category = category;
        existingLocation.Name = locationPutDto.Name;
        existingLocation.Description = locationPutDto.Description;

        await _locationRepository.SaveChangesAsync();

        var updatedLocationDTO = _mapper.Map<LocationResponseDTO>(existingLocation);
        await _webSocketNotificationService.BroadcastJsonAsync(new WebSocketPayload
        {
            EntityType = PayloadEntityType.Location,
            ActionType = PayloadActionType.Updated,
            Data = updatedLocationDTO
        });

        return updatedLocationDTO;
    }

    public async Task DeleteLocationAsync(int id)
    {
        _logger.InfoFormat("Deleting location with ID: {0}", id);
        var location = await _locationRepository.GetLocationByIdAsync(id) ??
            throw new NotFoundException("Location does not exist");

        await _locationRepository.DeleteLocationAsync(location);
        await _locationRepository.SaveChangesAsync();

        await _webSocketNotificationService.BroadcastJsonAsync(new WebSocketPayload
        {
            EntityType = PayloadEntityType.Location,
            ActionType = PayloadActionType.Deleted,
            Data = new { Id = id }
        });
    }

    public async Task<LocationResponseDTO> ExpireLocationAsync(int id)
    {
        _logger.InfoFormat("Expiring location with ID: {0}", id);
        var location = await _locationRepository.GetLocationByIdAsync(id) ??
            throw new NotFoundException("Location does not exist");

        location.IsExpired = true;
        await _locationRepository.SaveChangesAsync();

        var expiredLocationDTO = _mapper.Map<LocationResponseDTO>(location);
        await _webSocketNotificationService.BroadcastJsonAsync(new WebSocketPayload
        {
            EntityType = PayloadEntityType.Location,
            ActionType = PayloadActionType.Updated,
            Data = expiredLocationDTO
        });

        return expiredLocationDTO;
    }

    public async Task<LocationResponseDTO> ExtendLocationExpirationAsync(int id)
    {
        _logger.InfoFormat("Extending expiration for location with ID: {0}", id);
        var location = await _locationRepository.GetLocationByIdAsync(id) ??
            throw new NotFoundException("Location does not exist");

        location.IsExpired = false;
        location.ExpiresAt = DateTime.UtcNow.AddHours(1);
        await _locationRepository.SaveChangesAsync();

        var extendedLocationDTO = _mapper.Map<LocationResponseDTO>(location);
        await _webSocketNotificationService.BroadcastJsonAsync(new WebSocketPayload
        {
            EntityType = PayloadEntityType.Location,
            ActionType = PayloadActionType.Updated,
            Data = extendedLocationDTO
        });

        return extendedLocationDTO;
    }

    public async Task<LocationResponseDTO> LikeLocationAsync(int id, int userId = 1)
    {
        _logger.InfoFormat("Liking location with ID: {0} by user ID: {1}", id, userId);

        var location = await _locationRepository.GetLocationByIdAsync(id) ??
            throw new NotFoundException("Location does not exist");

        var user = await _userRepository.GetUserByIdAsync(userId) ??
            throw new NotFoundException("User does not exist");

        var wasLiked = location.Likes.Any(u => u.Id == user.Id);
        if (wasLiked)
        {
            location.Likes.Remove(user);
        }
        else
        {
            location.Likes.Add(user);
        }
        await _locationRepository.SaveChangesAsync();

        var likeLocationDTO = _mapper.Map<LocationResponseDTO>(location) with
        {
            IsLikedByCurrentUser = location.Likes.Any(u => u.Id == userId),
        };

        var broadcastDto = new LocationLikesSummaryDTO
        {
            Id = location.Id,
            LikesCount = location.Likes.Count,
            ToggledByUserId = userId,
            IsNowLiked = !wasLiked
        };

        await _webSocketNotificationService.BroadcastJsonAsync(new WebSocketPayload
        {
            EntityType = PayloadEntityType.Location,
            ActionType = PayloadActionType.Updated,
            Data = broadcastDto
        });

        return likeLocationDTO;
    }
}
