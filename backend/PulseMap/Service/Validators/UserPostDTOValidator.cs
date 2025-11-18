using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;

namespace PulseMap.Service.Validators;

public class UserPostDTOValidator : AbstractValidator<UserPostDTO>
{
    private readonly IUserRepository _userRepository;
    public UserPostDTOValidator(IUserRepository userRepository)
    {
        _userRepository = userRepository;

        RuleFor(user => user.Username)
            .NotEmpty()
            .WithMessage("Username is required.")
            .MaximumLength(50)
            .WithMessage("Username cannot exceed 50 characters.");

        RuleFor(user => user.Email)
            .NotEmpty()
            .WithMessage("Email is required.")
            .EmailAddress()
            .WithMessage("A valid email address is required.")
            .MustAsync(async (email, cancellation) =>
            {
                var existingUser = await _userRepository.GetUserByEmailAsync(email);
                return existingUser == null;
            })
            .WithMessage("Email already in use.");

        RuleFor(user => user.Password)
            .NotEmpty()
            .WithMessage("Password is required")
            .MinimumLength(8)
            .WithMessage("Password must meet complexity requirements.");

        RuleFor(user => user.FirstName)
            .NotEmpty()
            .WithMessage("First name is required.")
            .MaximumLength(50)
            .WithMessage("First name cannot exceed 50 characters.");

        RuleFor(user => user.LastName)
            .NotEmpty()
            .WithMessage("Last name is required.")
            .MaximumLength(50)
            .WithMessage("Last name cannot exceed 50 characters.");

    }       
}
