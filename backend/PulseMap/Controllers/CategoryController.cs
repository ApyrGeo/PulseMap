using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;

namespace PulseMap.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CategoryController(ICategoryService categoryService) : ControllerBase
{
    private readonly ICategoryService _categoryService = categoryService;

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(200)]
    public async Task<ActionResult<List<CategoryResponseDTO>>> GetCategories([FromQuery] bool onlyActive = true)
    {
        var categories = await _categoryService.GetCategoriesAsync(onlyActive);
        return Ok(categories);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(201)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(422)]
    public async Task<ActionResult<CategoryResponseDTO>> AddCategory([FromBody] CategoryPostDTO dto)
    {
        var added = await _categoryService.AddCategoryAsync(dto);
        return CreatedAtAction(nameof(GetCategories), new { onlyActive = false }, added);
    }
}
