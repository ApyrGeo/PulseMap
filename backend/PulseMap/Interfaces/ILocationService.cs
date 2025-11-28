using PulseMap.Domain.DTOs;

namespace PulseMap.Interfaces;

public interface ILocationService
{
    Task<LocationResponseDTO> AddLocationAsync(LocationPostDTO locationPostDTO);
    Task DeleteLocationAsync(int id);
    Task<LocationResponseDTO> ExpireLocationAsync(int id);
    Task<LocationResponseDTO> ExtendLocationExpirationAsync(int id);
    Task<List<LocationResponseDTO>> GetActiveLocationsAsync();
    Task<List<LocationResponseDTO>> GetAllLocationsAsync();
    Task<LocationResponseDTO?> GetLocationByIdAsync(int id);
    Task<LocationResponseDTO?> UpdateLocationAsync(LocationPutDTO locationResponseDTO, int id);
}
