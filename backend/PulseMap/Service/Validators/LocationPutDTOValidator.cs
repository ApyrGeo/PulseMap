using FluentValidation;
using PulseMap.Domain.DTOs;
using PulseMap.Domain.Enums;

namespace PulseMap.Service.Validators;

public class LocationPutDTOValidator : AbstractValidator<LocationPutDTO>
{
    public LocationPutDTOValidator()
    {
        RuleFor(location => location.Name)
            .NotEmpty()
            .WithMessage("Name is required.")
            .MaximumLength(100)
            .WithMessage("Name cannot exceed 100 characters.");

        RuleFor(location => location.Description)
            .MaximumLength(500)
            .WithMessage("Description cannot exceed 500 characters.");

        RuleFor(location => location.Category)
            .NotEmpty()
            .WithMessage("Category is required.")
            .Must(category => Enum.TryParse<Category>(category, true, out _))
            .WithMessage($"Category must be one of: {string.Join(", ", Enum.GetNames<Category>())}");
    }
}
