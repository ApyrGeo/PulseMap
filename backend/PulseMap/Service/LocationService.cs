using AutoMapper;
using Backend.Exceptions.Custom;
using log4net;
using PulseMap.Domain;
using PulseMap.Domain.DTOs;
using PulseMap.Domain.Enums;
using PulseMap.Interfaces;
using System.Text.Json;

namespace PulseMap.Service;

public class LocationService(ILocationRepository locationRepository, IMapper mapper, IValidatorFactory validatorFactory) : ILocationService
{
    private readonly ILocationRepository _locationRepository = locationRepository;
    private readonly IMapper _mapper = mapper;
    private readonly IValidatorFactory _validator = validatorFactory;
    private readonly ILog _logger = LogManager.GetLogger(typeof(LocationService));


    public async Task<LocationResponseDTO?> GetLocationByIdAsync(int id)
    {
        _logger.InfoFormat("Getting location by ID: {0}", id);
        var location = await _locationRepository.GetLocationByIdAsync(id)
            ?? throw new NotFoundException("Location not found");

        return _mapper.Map<LocationResponseDTO>(location);
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
        return _mapper.Map<LocationResponseDTO>(addedlocation);
    }

    public async Task<List<LocationResponseDTO>> GetAllLocationsAsync()
    {
        _logger.Info("Getting all locations");
        var locations = await _locationRepository.GetAllLocationsAsync();
        return _mapper.Map<List<LocationResponseDTO>>(locations);
    }

    public async Task<List<LocationResponseDTO>> GetActiveLocationsAsync()
    {
        _logger.Info("Getting active locations");
        var locations = await _locationRepository.GetActiveLocationsAsync();
        return _mapper.Map<List<LocationResponseDTO>>(locations);
    }

    public async Task<LocationResponseDTO?> UpdateLocationAsync(LocationPutDTO locationPutDto, int id)
    {
        _logger.InfoFormat("Updating location with ID: {0}", id);

        var existingLocation = await _locationRepository.GetLocationByIdAsync(id)
            ?? throw new NotFoundException("Location not found");

        var validator = _validator.Get<LocationPutDTO>();
        var result = await validator.ValidateAsync(locationPutDto);
        if(!result.IsValid)
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

        return _mapper.Map<LocationResponseDTO>(existingLocation);
    }

    public async Task DeleteLocationAsync(int id)
    {
        _logger.InfoFormat("Deleting location with ID: {0}", id);
        var location = await _locationRepository.GetLocationByIdAsync(id) ??
            throw new NotFoundException("Location does not exist");

        await _locationRepository.DeleteLocationAsync(location);
        await _locationRepository.SaveChangesAsync();
    }

    public async Task<LocationResponseDTO> ExpireLocationAsync(int id)
    {
        _logger.InfoFormat("Expiring location with ID: {0}", id);
        var location = await _locationRepository.GetLocationByIdAsync(id) ??
            throw new NotFoundException("Location does not exist");

        location.IsExpired = true;
        await _locationRepository.SaveChangesAsync();

        return _mapper.Map<LocationResponseDTO>(location);
    }

    public async Task<LocationResponseDTO> ExtendLocationExpirationAsync(int id)
    {
        _logger.InfoFormat("Extending expiration for location with ID: {0}", id);
        var location = await _locationRepository.GetLocationByIdAsync(id) ??
            throw new NotFoundException("Location does not exist");

        location.IsExpired = false;
        location.ExpiresAt = DateTime.UtcNow.AddHours(1);
        await _locationRepository.SaveChangesAsync();

        return _mapper.Map<LocationResponseDTO>(location);
    }
}
