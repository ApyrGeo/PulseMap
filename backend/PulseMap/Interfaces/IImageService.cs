namespace PulseMap.Interfaces;

public interface IImageService
{
    Task<List<string>> UploadImagesAsync(List<IFormFile> images);
    Task DeleteImageAsync(string imageUrl);
    Task<(Stream stream, string contentType)> GetImageAsync(string imageUrl);
}
