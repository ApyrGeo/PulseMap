using PulseMap.Domain.DTOs;

namespace PulseMap.Interfaces;

public interface ILocationService
{
    Task<LocationResponseDTO> AddLocationAsync(LocationPostDTO locationPostDTO);
    Task DeleteLocationAsync(int id);
    Task<LocationResponseDTO> ExpireLocationAsync(int id);
    Task<LocationResponseDTO> ExtendLocationExpirationAsync(int id);
    Task<List<LocationResponseDTO>> GetActiveLocationsAsync(int userId = 1);
    Task<List<LocationResponseDTO>> GetActiveLocationsInBoundsAsync(double minLat, double maxLat, double minLng, double maxLng, string? type);
    Task<List<LocationResponseDTO>> GetAllLocationsAsync(int userId = 1);
    Task<LocationResponseDTO?> GetLocationByIdAsync(int id, int userId = 1);
    Task<LocationResponseDTO> LikeLocationAsync(int id, int userId);
    Task<LocationResponseDTO?> UpdateLocationAsync(LocationPutDTO locationResponseDTO, int id);
}
