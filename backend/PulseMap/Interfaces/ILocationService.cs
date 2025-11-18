using PulseMap.Domain.DTOs;

namespace PulseMap.Interfaces;

public interface ILocationService
{
    Task<LocationResponseDTO> AddLocationAsync(LocationPostDTO locationPostDTO);
    Task DeleteLocationAsync(int id);
    Task<List<LocationResponseDTO>> GetAllLocationsAsync();
    Task<LocationResponseDTO?> GetLocationByIdAsync(int id);
    Task<LocationResponseDTO?> UpdateLocationAsync(LocationPutDTO locationResponseDTO, int id);
}
