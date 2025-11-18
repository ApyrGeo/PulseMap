using FluentValidation;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;

namespace PulseMap.Service.Validators;

public class MessagePostDTOValidator : AbstractValidator<MessagePostDTO>
{
    private readonly IUserRepository _userRepository;
    private readonly ILocationRepository _locationRepository;
    public MessagePostDTOValidator(IUserRepository userRepository, ILocationRepository locationRepository)
    {
        _userRepository = userRepository;
        _locationRepository = locationRepository;

        RuleFor(x => x.SenderId)
            .MustAsync(async (senderId, cancellation) =>
            {
                var user = await _userRepository.GetUserByIdAsync(senderId);
                return user != null;
            })
            .WithMessage("SenderId must correspond to an existing user.");

        RuleFor(x => x.LocationId)
            .MustAsync(async (locationId, cancellation) =>
            {
                var location = await _locationRepository.GetLocationByIdAsync(locationId);
                return location != null;
            })
            .WithMessage("LocationId must correspond to an existing location.");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Content is required.")
            .MaximumLength(500).WithMessage("Content must be at most 500 characters long.");
    }
}
