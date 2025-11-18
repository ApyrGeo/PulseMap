using FluentValidation;
using IValidatorFactory = PulseMap.Interfaces.IValidatorFactory;

namespace PulseMap.Service.Validators;

public class ValidatorFactory : IValidatorFactory
{
    private readonly IServiceProvider _serviceProvider;
    public ValidatorFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }
    public IValidator<T> Get<T>()
    {
        return _serviceProvider.GetRequiredService<IValidator<T>>();
    }
}
