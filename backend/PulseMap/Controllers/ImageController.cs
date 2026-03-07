using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PulseMap.Interfaces;

namespace PulseMap.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ImageController(IImageService imageService) : ControllerBase
{
    private readonly IImageService _imageService = imageService;

    [HttpPost("upload")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult<List<string>>> UploadImages([FromForm] List<IFormFile> images)
    {
        if (images == null || images.Count == 0)
        {
            return BadRequest("No images provided");
        }

        // Validate image files
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var maxFileSize = 10 * 1024 * 1024; // 10MB

        foreach (var image in images)
        {
            var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest($"Invalid file type: {extension}. Allowed types: {string.Join(", ", allowedExtensions)}");
            }

            if (image.Length > maxFileSize)
            {
                return BadRequest($"File {image.FileName} exceeds maximum size of 10MB");
            }
        }

        try
        {
            var imageUrls = await _imageService.UploadImagesAsync(images);
            return Ok(imageUrls);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error uploading images: {ex.Message}");
        }
    }

    [HttpDelete]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    public async Task<ActionResult> DeleteImage([FromQuery] string imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            return BadRequest("Image URL is required");
        }

        try
        {
            await _imageService.DeleteImageAsync(imageUrl);
            return Ok(new { message = "Image deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error deleting image: {ex.Message}");
        }
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult> GetImage([FromQuery] string imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            return BadRequest("Image URL is required");
        }

        try
        {
            var (stream, contentType) = await _imageService.GetImageAsync(imageUrl);
            return File(stream, contentType);
        }
        catch (Exception ex)
        {
            return NotFound($"Image not found: {ex.Message}");
        }
    }

    [HttpGet("{filename}")]
    [AllowAnonymous]
    [ProducesResponseType(200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult> GetImageByFilename(string filename)
    {
        if (string.IsNullOrWhiteSpace(filename))
        {
            return BadRequest("Filename is required");
        }

        try
        {
            var (stream, contentType) = await _imageService.GetImageAsync(filename);
            return File(stream, contentType);
        }
        catch (Exception ex)
        {
            return NotFound($"Image not found: {ex.Message}");
        }
    }
}
