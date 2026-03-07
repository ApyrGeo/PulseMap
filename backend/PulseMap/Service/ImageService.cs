using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using log4net;
using PulseMap.Interfaces;

namespace PulseMap.Service;

public class ImageService : IImageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly string _containerName;
    private readonly ILog _logger = LogManager.GetLogger(typeof(ImageService));

    public ImageService(IConfiguration configuration)
    {
        var connectionString = configuration["AzureStorage:ConnectionString"];
        _containerName = configuration["AzureStorage:ContainerName"] ?? "location-images";

        if (string.IsNullOrWhiteSpace(connectionString) || connectionString.Contains("YOUR_ACCOUNT_KEY"))
        {
            throw new InvalidOperationException(
                "Azure Storage connection string is not configured. " +
                "Please set AzureStorage:ConnectionString in appsettings.Development.json. " +
                "Get the connection string from Azure Portal -> Storage Account -> Access keys.");
        }

        _blobServiceClient = new BlobServiceClient(connectionString);
    }

    public async Task<List<string>> UploadImagesAsync(List<IFormFile> images)
    {
        var uploadedUrls = new List<string>();
        var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);

        // Ensure container exists with private access (public access is disabled on the storage account)
        await containerClient.CreateIfNotExistsAsync(PublicAccessType.None);

        foreach (var image in images)
        {
            if (image.Length == 0)
                continue;

            // Generate unique filename
            var fileExtension = Path.GetExtension(image.FileName);
            var uniqueFileName = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString()[..11]}{fileExtension}";

            var blobClient = containerClient.GetBlobClient(uniqueFileName);

            // Set content type
            var blobHttpHeaders = new BlobHttpHeaders
            {
                ContentType = image.ContentType
            };

            try
            {
                using var stream = image.OpenReadStream();
                await blobClient.UploadAsync(stream, new BlobUploadOptions
                {
                    HttpHeaders = blobHttpHeaders
                });

                // Return the blob filename, not the direct Azure URL
                // The frontend will access images through the API endpoint
                uploadedUrls.Add(uniqueFileName);
                _logger.InfoFormat("Image uploaded successfully: {0}", uniqueFileName);
            }
            catch (Exception ex)
            {
                _logger.Error($"Failed to upload image {image.FileName}", ex);
                throw;
            }
        }

        return uploadedUrls;
    }

    public async Task DeleteImageAsync(string imageUrl)
    {
        try
        {
            // imageUrl can be either a full Azure URL or just a filename
            var blobName = imageUrl.Contains("://")
                ? new Uri(imageUrl).Segments[^1]
                : imageUrl;

            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            var blobClient = containerClient.GetBlobClient(blobName);

            await blobClient.DeleteIfExistsAsync();
            _logger.InfoFormat("Image deleted successfully: {0}", blobName);
        }
        catch (Exception ex)
        {
            _logger.Error($"Failed to delete image {imageUrl}", ex);
            throw;
        }
    }

    public async Task<(Stream stream, string contentType)> GetImageAsync(string blobName)
    {
        try
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
            var blobClient = containerClient.GetBlobClient(blobName);

            var response = await blobClient.DownloadAsync();
            var contentType = response.Value.Details.ContentType;

            return (response.Value.Content, contentType);
        }
        catch (Exception ex)
        {
            _logger.Error($"Failed to get image {blobName}", ex);
            throw;
        }
    }
}
