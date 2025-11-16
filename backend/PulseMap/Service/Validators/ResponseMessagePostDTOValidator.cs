using FluentValidation;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;

namespace PulseMap.Service.Validators;

public class ResponseMessagePostDTOValidator : AbstractValidator<ResponseMessagePostDTO>
{
    private readonly IUserRepository _userRepository;
    public ResponseMessagePostDTOValidator(IUserRepository userRepository)
    {
        _userRepository = userRepository;

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("Content is required.")
            .MaximumLength(500).WithMessage("Content must be at most 500 characters long.");

        RuleFor(x => x.SenderId)
            .MustAsync(async (senderId, cancellation) =>
            {
                var user = await userRepository.GetUserByIdAsync(senderId);
                return user != null;
            })
            .WithMessage("SenderId must correspond to an existing user.");
    }
}
