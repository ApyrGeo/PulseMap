using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;

namespace PulseMap.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController(IUserService userService, IMapper mapper) : ControllerBase
    {
        private readonly IUserService _userService = userService;
        private readonly IMapper _mapper = mapper;

        [HttpGet("{id}")]
        [ProducesResponseType(200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<UserResponseDTO>> GetUserById(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            return Ok(user);
        }

        [HttpPost]
        [ProducesResponseType(201)]
        [ProducesResponseType(422)]
        public async Task<ActionResult<UserResponseDTO>> CreateUser([FromBody] UserPostDTO userPostDTO)
        {
            var addedUser = await _userService.CreateUserAsync(userPostDTO);
            return CreatedAtAction(nameof(GetUserById), new { id = addedUser.Id }, addedUser);
        }

        [HttpGet("login")]
        public async Task<ActionResult<UserResponseDTO>> Login([FromQuery] string email, [FromQuery] string password)
        {
            var user = await _userService.LoginUser(email, password);
            return Ok(user);
        }
    }
}
