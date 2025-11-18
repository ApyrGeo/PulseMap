using AutoMapper;
using Backend.Exceptions.Custom;
using log4net;
using PulseMap.Domain;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;
using System.Text.Json;

namespace PulseMap.Service;

public class UserService(IUserRepository userRepository, IMapper mapper, IValidatorFactory validatorFactory) : IUserService
{
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IMapper _mapper = mapper;
    private readonly IValidatorFactory _validatorFactory = validatorFactory;
    private readonly ILog _logger = LogManager.GetLogger(typeof(UserService));

    public async Task<UserResponseDTO> GetUserByIdAsync(int id)
    {
        _logger.InfoFormat("Getting user by id: {0}", id);
        var user = await _userRepository.GetUserByIdAsync(id)
            ?? throw new NotFoundException("User not found");

        return _mapper.Map<UserResponseDTO>(user);
    }

    public async Task<UserResponseDTO> CreateUserAsync(UserPostDTO user)
    {
        _logger.DebugFormat("Creating user: {0}", JsonSerializer.Serialize(user));
        var validator = _validatorFactory.Get<UserPostDTO>();
        var result = await validator.ValidateAsync(user);
        if(!result.IsValid)
        {
            throw new EntityValidationException(result.Errors);
        }

        var userEntity = _mapper.Map<User>(user);
        var addedUser = await _userRepository.CreateUserAsync(userEntity);
        await _userRepository.SaveChangesAsync();
        return _mapper.Map<UserResponseDTO>(addedUser);
    }
}
