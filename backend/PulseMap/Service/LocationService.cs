using AutoMapper;
using Backend.Exceptions.Custom;
using log4net;
using PulseMap.Domain;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;
using PulseMap.Service.WS;
using System.Text.Json;

namespace PulseMap.Service;

public class LocationService(
    ILocationRepository locationRepository,
    ICategoryRepository categoryRepository,
    IRecommendationAiScorer recommendationAiScorer,
    IUserRepository userRepository,
    IMessageRepository messageRepository,
    IInteractionRepository interactionRepository,
    IMapper mapper,
    IValidatorFactory validatorFactory,
    IWebSocketNotificationService webSocketNotificationService,
    IAIStatisticsService aiStatisticsService) : ILocationService
{
    private readonly ILocationRepository _locationRepository = locationRepository;
    private readonly ICategoryRepository _categoryRepository = categoryRepository;
    private readonly IRecommendationAiScorer _recommendationAiScorer = recommendationAiScorer;
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IMessageRepository _messageRepository = messageRepository;
    private readonly IInteractionRepository _interactionRepository = interactionRepository;
    private readonly IMapper _mapper = mapper;
    private readonly IValidatorFactory _validator = validatorFactory;
    private readonly IAIStatisticsService _aiStatisticsService = aiStatisticsService;
    private readonly IWebSocketNotificationService _webSocketNotificationService = webSocketNotificationService;
    private readonly ILog _logger = LogManager.GetLogger(typeof(LocationService));

    public async Task<LocationResponseDTO?> GetLocationByIdAsync(int id, int userId = 1)
    {
        _logger.InfoFormat("Getting location by ID: {0}", id);
        var location = await _locationRepository.GetLocationByIdAsync(id)
            ?? throw new NotFoundException("Location not found");

        // Filter out ResponseMessage from Comments (only return base Message objects)
        location.Comments = location.Comments?
            .Where(c => c is not ResponseMessage)
            .ToList();

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

        // Check if user already owns a location
        if (locationPostDTO.OwnerId.HasValue)
        {
            var existingOwnedLocation = await _locationRepository.GetLocationByOwnerIdAsync(locationPostDTO.OwnerId.Value);
            if (existingOwnedLocation != null && !existingOwnedLocation.IsExpired)
            {
                _logger.WarnFormat("User {0} already owns an active location (ID: {1})", locationPostDTO.OwnerId.Value, existingOwnedLocation.Id);
                throw new EntityValidationException($"User already owns an active location. Each user can only own one location at a time.");
            }
        }

        _logger.InfoFormat("Adding new location: {0}", JsonSerializer.Serialize(locationPostDTO));
        var location = _mapper.Map<Location>(locationPostDTO);
        var category = await _categoryRepository.GetByNameAsync(locationPostDTO.Category)
            ?? throw new EntityValidationException($"Invalid category value: {locationPostDTO.Category}");

        location.CategoryId = category.Id;
        location.Category = category;
        location.ExpiresAt = DateTime.UtcNow.Add(locationPostDTO.Duration);
        location.IsExpired = false;

        // Convert image URLs to LocationImage entities
        if (locationPostDTO.ImageUrls != null && locationPostDTO.ImageUrls.Any())
        {
            location.Images = locationPostDTO.ImageUrls.Select((url, index) => new LocationImage
            {
                Url = url,
                CreatedAt = DateTime.UtcNow,
                Order = index
            }).ToList();
        }

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
        var category = await _categoryRepository.GetByNameAsync(locationPutDto.Category)
            ?? throw new EntityValidationException($"Invalid category value: {locationPutDto.Category}");

        existingLocation.CategoryId = category.Id;
        existingLocation.Category = category;
        existingLocation.Name = locationPutDto.Name;
        existingLocation.Description = locationPutDto.Description;

        if (locationPutDto.ImageUrls != null)
        {
            existingLocation.Images.Clear();
            for (var i = 0; i < locationPutDto.ImageUrls.Count; i++)
            {
                existingLocation.Images.Add(new LocationImage
                {
                    Url = locationPutDto.ImageUrls[i],
                    CreatedAt = DateTime.UtcNow,
                    Order = i,
                });
            }
        }

        await _locationRepository.SaveChangesAsync();

        // Filter out ResponseMessage from Comments
        existingLocation.Comments = existingLocation.Comments?
            .Where(c => c is not ResponseMessage)
            .ToList();

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
        location.LikeStatus = null;
        await _locationRepository.SaveChangesAsync();

        // Filter out ResponseMessage from Comments
        location.Comments = location.Comments?
            .Where(c => c is not ResponseMessage)
            .ToList();

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
        location.LikeStatus = new LikeStatus
        {
            LastChecked = DateTime.UtcNow,
            Location = location,
            PreviousLikeCount = location.Likes.Count
        };
        await _locationRepository.SaveChangesAsync();

        // Filter out ResponseMessage from Comments
        location.Comments = location.Comments?
            .Where(c => c is not ResponseMessage)
            .ToList();

        var extendedLocationDTO = _mapper.Map<LocationResponseDTO>(location);
        await _webSocketNotificationService.BroadcastJsonAsync(new WebSocketPayload
        {
            EntityType = PayloadEntityType.Location,
            ActionType = PayloadActionType.Updated,
            Data = extendedLocationDTO
        });

        return extendedLocationDTO;
    }

    public async Task<LocationResponseDTO> LikeLocationAsync(int id, int userId)
    {
        _logger.InfoFormat("Liking location with ID: {0} by user ID: {1}", id, userId);

        var location = await _locationRepository.GetLocationByIdAsync(id) ??
            throw new NotFoundException("Location does not exist");

        var user = await _userRepository.GetUserByIdAsync(userId) ??
            throw new NotFoundException("User does not exist");

        if (location.CreatorId == userId)
            throw new InvalidOperationException("You cannot like your own location.");

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

        // Filter out ResponseMessage from Comments
        location.Comments = location.Comments?
            .Where(c => c is not ResponseMessage)
            .ToList();

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

    public async Task<List<LocationResponseDTO>> GetActiveLocationsInBoundsAsync(double minLat, double maxLat, double minLng, double maxLng, string? type, int userId = 1)
    {
        _logger.InfoFormat("Getting active locations in bounds: ({0}, {1}), ({2}, {3})", minLat, maxLat, minLng, maxLng);

        //validation
        if (minLat < -90 || maxLat > 90 || minLng < -180 || maxLng > 180 || minLat > maxLat || minLng > maxLng)
        {
            throw new EntityValidationException("Invalid geographical bounds provided.");
        }

        var locations = await _locationRepository.GetActiveLocationsInBoundsAsync(minLat, maxLat, minLng, maxLng);

        if (type != null)
        {
            _logger.InfoFormat("Filtering locations by type: {0}", type);
            locations = [.. locations.Where(loc => string.Equals(loc.Category?.Name, type, StringComparison.OrdinalIgnoreCase))];
        }

        foreach (var loc in locations)
        {
            loc.Comments = loc.Comments?
                .Where(c => c is not ResponseMessage)
                .ToList();
        }

        return [.. locations.Select(loc =>
            _mapper.Map<LocationResponseDTO>(loc) with
            {
                IsLikedByCurrentUser = loc.Likes.Any(u => u.Id == userId),
            }
        )];
    }

    public async Task<List<LocationRecommendationResponseDTO>> GetRecommendedLocationsInBoundsAsync(
        double minLat,
        double maxLat,
        double minLng,
        double maxLng,
        int userId,
        int count = 10)
    {
        if (minLat < -90 || maxLat > 90 || minLng < -180 || maxLng > 180 || minLat > maxLat || minLng > maxLng)
        {
            throw new EntityValidationException("Invalid geographical bounds provided.");
        }

        if (count < 1)
        {
            count = 1;
        }

        if (count > 50)
        {
            count = 50;
        }

        var inBoundsLocations = await _locationRepository.GetActiveLocationsInBoundsAsync(minLat, maxLat, minLng, maxLng);
        var likedLocations = await _locationRepository.GetLikedLocationsByUserIdAsync(userId);
        var likedLocationIds = likedLocations.Select(l => l.Id).ToHashSet();

        var interactedLocationIds = await _interactionRepository.GetInteractedLocationIdsByUserIdAsync(userId);
        var interactedLocationIdSet = interactedLocationIds.ToHashSet();

        var preferenceScores = new Dictionary<int, double>();

        foreach (var liked in likedLocations.Where(l => l.CategoryId > 0))
        {
            if (!preferenceScores.ContainsKey(liked.CategoryId))
            {
                preferenceScores[liked.CategoryId] = 0;
            }
            preferenceScores[liked.CategoryId] += 1.0;
        }

        var centerLat = (minLat + maxLat) / 2;
        var centerLng = (minLng + maxLng) / 2;
        var now = DateTime.UtcNow;

        var recommendationCandidates = inBoundsLocations
            .Where(l => !likedLocationIds.Contains(l.Id) && !interactedLocationIdSet.Contains(l.Id) && l.CreatorId != userId)
            .ToList();

        var likedDescriptions = likedLocations
            .Where(l => !string.IsNullOrWhiteSpace(l.Description))
            .Select(l => l.Description!)
            .ToList();

        // Include interacted location descriptions in AI preference profile
        var interactedLocations = await _locationRepository.GetLocationsByIdsAsync(interactedLocationIds.Take(20).ToList());
        var interactedDescriptions = interactedLocations
            .Where(l => !string.IsNullOrWhiteSpace(l.Description))
            .Select(l => l.Description!)
            .ToList();

        var combinedDescriptions = likedDescriptions
            .Concat(interactedDescriptions)
            .Distinct()
            .Take(30)
            .ToList();

        await _aiStatisticsService.IncrementRecommendationRequestAsync();

        var aiSimilarityScores = await _recommendationAiScorer.ScoreCandidatesByProfileAsync(
            combinedDescriptions,
            recommendationCandidates.Select(c => (c.Id, c.Description ?? string.Empty)).ToList());

        if (aiSimilarityScores.Count > 0)
            await _aiStatisticsService.IncrementRecommendationAiAsync();
        else
            await _aiStatisticsService.IncrementRecommendationFallbackAsync();

        var recommendations = recommendationCandidates
            .Select(location =>
            {
                var affinity = preferenceScores.TryGetValue(location.CategoryId, out var affinityScore)
                    ? affinityScore
                    : 0;

                var aiSimilarity = aiSimilarityScores.TryGetValue(location.Id, out var semanticScore)
                    ? semanticScore
                    : 0;

                var popularity = Math.Log(1 + location.Likes.Count);
                var distanceMeters = CalculateDistance(centerLat, centerLng, location.Latitude, location.Longitude);
                var distanceScore = 1.0 / (1.0 + (distanceMeters / 1000.0));
                var freshnessHours = Math.Max((location.ExpiresAt - now).TotalHours, 0);
                var freshnessScore = Math.Min(freshnessHours / 72.0, 1.0);

                var totalScore =
                    (2.4 * affinity) +
                    (2.0 * aiSimilarity) +
                    popularity +
                    (1.2 * distanceScore) +
                    (0.5 * freshnessScore);

                var reason = aiSimilarity >= 0.65
                    ? "AI matched this location to your liked-location profile"
                    : affinity > 0
                        ? $"Matches your interest in {location.Category?.Name ?? "this category"}"
                        : "Popular and nearby in your current map area";

                return new LocationRecommendationResponseDTO
                {
                    Id = location.Id,
                    Name = location.Name,
                    Description = location.Description,
                    Category = location.Category?.Name ?? "Not Set",
                    Latitude = location.Latitude,
                    Longitude = location.Longitude,
                    LikesCount = location.Likes.Count,
                    Score = Math.Round(totalScore, 4),
                    Reason = reason
                };
            })
            .OrderByDescending(r => r.Score)
            .ThenByDescending(r => r.LikesCount)
            .Take(count)
            .ToList();

        return recommendations;
    }

    public async Task<List<(int Location1Id, int Location2Id, double Distance)>> GetNearbyLocationPairsAsync(double maxDistanceMeters = 20)
    {
        _logger.InfoFormat("Finding location pairs within {0} meters", maxDistanceMeters);

        var activeLocations = await _locationRepository.GetActiveLocationsAsync();
        var pairs = new List<(int, int, double)>();

        for (int i = 0; i < activeLocations.Count; i++)
        {
            for (int j = i + 1; j < activeLocations.Count; j++)
            {
                var loc1 = activeLocations[i];
                var loc2 = activeLocations[j];

                var distance = CalculateDistance(loc1.Latitude, loc1.Longitude, loc2.Latitude, loc2.Longitude);

                if (distance <= maxDistanceMeters)
                {
                    pairs.Add((loc1.Id, loc2.Id, distance));
                    _logger.InfoFormat("Found nearby pair: Location {0} and {1} at {2:F2}m distance", loc1.Id, loc2.Id, distance);
                }
            }
        }

        _logger.InfoFormat("Found {0} location pairs within {1} meters", pairs.Count, maxDistanceMeters);
        return pairs;
    }

    public async Task<bool> MergeLocationsAsync(int keepLocationId, int removeLocationId)
    {
        _logger.InfoFormat("Merging locations: keeping {0}, removing {1}", keepLocationId, removeLocationId);

        var keepLocation = await _locationRepository.GetLocationByIdAsync(keepLocationId) ??
            throw new NotFoundException($"Location {keepLocationId} not found");

        var removeLocation = await _locationRepository.GetLocationByIdAsync(removeLocationId) ??
            throw new NotFoundException($"Location {removeLocationId} not found");

        // PRIORITY 1: Keep owned location (even if non-owned has better description)
        bool keepHasOwner = keepLocation.OwnerId.HasValue;
        bool removeHasOwner = removeLocation.OwnerId.HasValue;

        if (removeHasOwner && !keepHasOwner)
        {
            // Remove location is owned but keep is not - swap them
            _logger.InfoFormat("Swapping: location {0} is owned by user {1}, prioritizing it over non-owned location {2}",
                removeLocationId, removeLocation.OwnerId, keepLocationId);
            (keepLocation, removeLocation) = (removeLocation, keepLocation);
            (keepLocationId, removeLocationId) = (removeLocationId, keepLocationId);
        }
        else if (!removeHasOwner && !keepHasOwner)
        {
            // PRIORITY 2: Neither is owned - keep the one with longer/better description
            if (removeLocation.Description.Length > keepLocation.Description.Length)
            {
                _logger.InfoFormat("Swapping: both locations are non-owned, keeping location {0} with longer description",
                    removeLocationId);
                (keepLocation, removeLocation) = (removeLocation, keepLocation);
                (keepLocationId, removeLocationId) = (removeLocationId, keepLocationId);
            }
        }
        // else: keep is owned, or both are owned - keep the original keepLocationId

        // Add the removed location's description as a comment to the kept location
        if (!string.IsNullOrWhiteSpace(removeLocation.Description) &&
            removeLocation.Description != keepLocation.Description)
        {
            _logger.InfoFormat("Adding removed location's description as a comment");

            // Get the creator (or fallback to first user)
            var creatorId = keepLocation.CreatorId ?? removeLocation.CreatorId ?? 1;

            var mergeComment = new Message
            {
                Id = 0, // Will be set by DB
                Content = $"[Merged location]: {removeLocation.Description}",
                LocationId = keepLocationId,
                SenderId = creatorId,
                SentAt = DateTime.UtcNow
            };

            await _messageRepository.AddMessageAsync(mergeComment);

            _logger.InfoFormat("Added merge comment with removed description");
        }

        // Transfer comments from removeLocation to keepLocation as messages
        if (removeLocation.Comments != null && removeLocation.Comments.Any())
        {
            _logger.InfoFormat("Transferring {0} comments from location {1} to {2}", removeLocation.Comments.Count, removeLocationId, keepLocationId);

            foreach (var comment in removeLocation.Comments.Where(c => c is not ResponseMessage))
            {
                comment.LocationId = keepLocationId;
            }
        }

        // Transfer likes (avoiding duplicates)
        if (removeLocation.Likes != null && removeLocation.Likes.Any())
        {
            _logger.InfoFormat("Transferring {0} likes from location {1} to {2}", removeLocation.Likes.Count, removeLocationId, keepLocationId);

            foreach (var user in removeLocation.Likes)
            {
                if (!keepLocation.Likes.Any(u => u.Id == user.Id))
                {
                    keepLocation.Likes.Add(user);
                }
            }
        }

        // Transfer images from removeLocation to keepLocation
        if (removeLocation.Images != null && removeLocation.Images.Any())
        {
            _logger.InfoFormat("Transferring {0} images from location {1} to {2}", removeLocation.Images.Count, removeLocationId, keepLocationId);

            foreach (var image in removeLocation.Images)
            {
                image.LocationId = keepLocationId;
            }
        }

        // Delete the redundant location
        await _locationRepository.DeleteLocationAsync(removeLocation);
        await _locationRepository.SaveChangesAsync();

        _logger.InfoFormat("Successfully merged location {0} into {1}", removeLocationId, keepLocationId);

        // Broadcast update for the kept location
        var updatedLocationDTO = _mapper.Map<LocationResponseDTO>(keepLocation);
        await _webSocketNotificationService.BroadcastJsonAsync(new WebSocketPayload
        {
            EntityType = PayloadEntityType.Location,
            ActionType = PayloadActionType.Updated,
            Data = updatedLocationDTO
        });

        // Broadcast deletion for the removed location
        await _webSocketNotificationService.BroadcastJsonAsync(new WebSocketPayload
        {
            EntityType = PayloadEntityType.Location,
            ActionType = PayloadActionType.Deleted,
            Data = new { Id = removeLocationId }
        });

        return true;
    }

    private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        // Haversine formula to calculate distance in meters
        const double R = 6371000; // Earth's radius in meters
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c; // Distance in meters
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;

    public async Task<List<LocationResponseDTO>> GetLocationsNeedingReviewAsync(int? eventId = null)
    {
        _logger.InfoFormat("Getting locations that need review (eventId: {0})", eventId?.ToString() ?? "all");

        var allLocations = await _locationRepository.GetActiveLocationsAsync();

        var locationsNeedingReview = allLocations
            .Where(l => l.RequiresReview && l.EventId.HasValue);

        if (eventId.HasValue)
        {
            locationsNeedingReview = locationsNeedingReview.Where(l => l.EventId == eventId.Value);
        }

        var result = locationsNeedingReview
            .Select(l => _mapper.Map<LocationResponseDTO>(l))
            .ToList();

        _logger.InfoFormat("Found {0} locations needing review", result.Count);
        return result;
    }

    public async Task<LocationResponseDTO> ConfirmLocationEventAsync(int locationId)
    {
        _logger.InfoFormat("Confirming location {0} event assignment", locationId);

        var location = await _locationRepository.GetLocationByIdAsync(locationId)
            ?? throw new NotFoundException($"Location with ID {locationId} not found");

        if (!location.EventId.HasValue)
        {
            throw new InvalidOperationException($"Location {locationId} is not assigned to any event");
        }

        location.RequiresReview = false;
        await _locationRepository.UpdateLocationAsync(location);

        _logger.InfoFormat("Location {0} event assignment confirmed (EventId: {1})", locationId, location.EventId);

        var dto = _mapper.Map<LocationResponseDTO>(location);

        // Broadcast update
        await _webSocketNotificationService.BroadcastJsonAsync(new WebSocketPayload
        {
            EntityType = PayloadEntityType.Location,
            ActionType = PayloadActionType.Updated,
            Data = dto
        });

        return dto;
    }

    public async Task<LocationResponseDTO> RejectLocationEventAsync(int locationId)
    {
        _logger.InfoFormat("Rejecting location {0} event assignment", locationId);

        var location = await _locationRepository.GetLocationByIdAsync(locationId)
            ?? throw new NotFoundException($"Location with ID {locationId} not found");

        var previousEventId = location.EventId;

        location.EventId = null;
        location.EventAssignmentConfidence = null;
        location.RequiresReview = false;
        await _locationRepository.UpdateLocationAsync(location);

        _logger.InfoFormat("Location {0} removed from event {1}", locationId, previousEventId);

        var dto = _mapper.Map<LocationResponseDTO>(location);

        await _webSocketNotificationService.BroadcastJsonAsync(new WebSocketPayload
        {
            EntityType = PayloadEntityType.Location,
            ActionType = PayloadActionType.Updated,
            Data = dto
        });

        return dto;
    }

    public async Task<LocationResponseDTO> ToggleStarAsync(int locationId)
    {
        _logger.InfoFormat("Toggling star on location {0}", locationId);
        await _locationRepository.ToggleStarAsync(locationId);
        await _locationRepository.SaveChangesAsync();
        var location = await _locationRepository.GetLocationByIdAsync(locationId)
            ?? throw new NotFoundException($"Location {locationId} not found");
        return _mapper.Map<LocationResponseDTO>(location);
    }

    public async Task<List<LocationResponseDTO>> GetStarredLocationsAsync()
    {
        var locations = await _locationRepository.GetStarredLocationsAsync();
        return [.. locations.Select(l => _mapper.Map<LocationResponseDTO>(l))];
    }

    public async Task<List<Location>> SeedStarredLocationsAsync()
    {
        _logger.Info("Extending starred locations by 1 day");
        var starred = await _locationRepository.GetStarredLocationsAsync();
        if (starred.Count == 0) return [];

        var toExtend = starred.Where(loc => loc.IsExpired || loc.ExpiresAt < DateTime.UtcNow).ToList();
        if (toExtend.Count == 0) return [];

        foreach (var loc in toExtend)
        {
            loc.ExpiresAt = DateTime.UtcNow.AddDays(1);
            loc.IsExpired = false;
        }
        starred = toExtend;

        await _locationRepository.SaveChangesAsync();
        _logger.InfoFormat("Extended {0} starred locations by 1 day", starred.Count);
        return starred;
    }

    public async Task<List<FeaturedLocationDTO>> GetFeaturedLocationsAsync(int count = 15)
    {
        var locations = await _locationRepository.GetLocationsWithImagesAsync(count * 3);
        return locations
            .Take(count)
            .Select(l => new FeaturedLocationDTO(
                l.Id,
                l.Name,
                l.Images.OrderBy(img => img.Order).Select(img => img.Url).ToList(),
                l.Likes.Count,
                l.Creator?.UserName))
            .ToList();
    }
}

