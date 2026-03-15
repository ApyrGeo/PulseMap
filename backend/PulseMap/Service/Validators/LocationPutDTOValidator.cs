using FluentValidation;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;

namespace PulseMap.Service.Validators;

public class LocationPutDTOValidator : AbstractValidator<LocationPutDTO>
{
    public LocationPutDTOValidator(ICategoryRepository categoryRepository)
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
            .MustAsync(async (category, cancellation) =>
            {
                var existingCategory = await categoryRepository.GetByNameAsync(category);
                return existingCategory != null && existingCategory.IsActive;
            })
            .WithMessage("Category must be an existing active category.");
    }
}
