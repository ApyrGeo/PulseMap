using FluentValidation;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;

namespace PulseMap.Service.Validators;

public class LocationPostDTOValidator : AbstractValidator<LocationPostDTO>
{
    private readonly ILocationRepository _locationRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICategoryRepository _categoryRepository;
    public LocationPostDTOValidator(ILocationRepository locationRepository, IUserRepository userRepository, ICategoryRepository categoryRepository)
    {
        _locationRepository = locationRepository;
        _userRepository = userRepository;
        _categoryRepository = categoryRepository;

        RuleFor(location => location.Latitude)
            .InclusiveBetween(-90, 90)
            .WithMessage("Latitude must be between -90 and 90.");

        RuleFor(location => location.Longitude)
            .InclusiveBetween(-180, 180)
            .WithMessage("Longitude must be between -180 and 180.");

        RuleFor(location => location.Name)
            .NotEmpty()
            .WithMessage("Name is required.")
            .MaximumLength(100)
            .WithMessage("Name cannot exceed 100 characters.");

        RuleFor(location => location.Description)
            .MaximumLength(500)
            .WithMessage("Description cannot exceed 500 characters.");

        RuleFor(location => location.CreatorId)
            .MustAsync(async (creatorId, cancellation) =>
            {
                var user = await _userRepository.GetUserByIdAsync(creatorId);
                return user != null;
            })
            .WithMessage("CreatorId must correspond to an existing user.");

        RuleFor(location => location.Category)
            .NotEmpty()
            .WithMessage("Category is required.")
            .MustAsync(async (category, cancellation) =>
            {
                var existingCategory = await _categoryRepository.GetByNameAsync(category);
                return existingCategory != null && existingCategory.IsActive;
            })
            .WithMessage("Category must be an existing active category.");

        RuleFor(location => location.Duration)
            .NotEmpty()
            .WithMessage("Duration is required.")
            .Must(duration => duration > TimeSpan.Zero)
            .WithMessage("Duration must be a positive time span.");

        RuleFor(location => location.OwnerId)
            .MustAsync(async (ownerId, cancellation) =>
            {
                if (ownerId == null)
                    return true;
                var user = await _userRepository.GetUserByIdAsync(ownerId.Value);
                return user != null;
            })
            .WithMessage("OwnerId must correspond to an existing user if provided.");
    }
}
