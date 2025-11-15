using PulseMap.Domain.DTOs;

namespace PulseMap.Interfaces;

public interface ILocationService
{
    Task<LocationResponseDTO> AddLocationAsync(LocationPostDTO locationPostDTO);
    Task<List<LocationResponseDTO>> GetAllLocationsAsync();
    Task<LocationResponseDTO?> GetLocationByIdAsync(int id);
}
