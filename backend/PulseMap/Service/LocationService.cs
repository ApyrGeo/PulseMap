using AutoMapper;
using Backend.Exceptions.Custom;
using log4net;
using PulseMap.Domain;
using PulseMap.Domain.DTOs;
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
}
