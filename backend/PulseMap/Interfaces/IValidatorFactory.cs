using FluentValidation;

namespace PulseMap.Interfaces;

public interface IValidatorFactory
{
    IValidator<T> Get<T>();
}
