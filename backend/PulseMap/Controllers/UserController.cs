using AutoMapper;
using Microsoft.AspNetCore.Authorization;
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
        [Authorize(Policy = "SameUserOrAdmin")]
        [ProducesResponseType(200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(403)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<UserResponseDTO>> GetUserById(int id)
        {
            var user = await _userService.GetUserByIdAsync(id);
            return Ok(user);
        }

        [HttpPost("register")]
        [AllowAnonymous]
        [ProducesResponseType(201)]
        [ProducesResponseType(422)]
        public async Task<ActionResult<UserResponseDTO>> CreateUser([FromBody] UserPostDTO userPostDTO)
        {
            var addedUser = await _userService.CreateUserAsync(userPostDTO);
            return CreatedAtAction(nameof(GetUserById), new { id = addedUser.Id }, addedUser);
        }

        [HttpPost("login")]
        [AllowAnonymous]
        [ProducesResponseType(200)]
        [ProducesResponseType(401)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<LoginResponseDTO>> Login([FromBody] LoginRequestDTO loginRequest)
        {
            var loginResponse = await _userService.LoginUser(loginRequest.Email, loginRequest.Password);
            return Ok(loginResponse);
        }
    }
}
