using FluentValidation;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PulseMap.BackgroundServices;
using PulseMap.Context;
using PulseMap.Domain;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;
using PulseMap.Middlewares;
using PulseMap.Repository;
using PulseMap.Service;
using PulseMap.Service.Validators;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var AppAllowSpecificOrigins = "_appAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: AppAllowSpecificOrigins, policy =>
    {
        policy.AllowAnyHeader()
        .AllowAnyMethod()
        .AllowAnyOrigin();
    });
});

//database
builder.Services.AddDbContext<PulseMapContext>((sp, options) =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
        );
});

//automapper
builder.Services.AddAutoMapper(cfg => {
    // User
    cfg.CreateMap<User, UserResponseDTO>();
    cfg.CreateMap<UserPostDTO, User>().ReverseMap();
    cfg.CreateMap<User, SimplifiedUserResponseDTO>();

    // Message 
    cfg.CreateMap<Message, ResponseMessageResponseDTO>()
        .IncludeMembers(src => src);

    cfg.CreateMap<ResponseMessage, ResponseMessageResponseDTO>()
        .IncludeBase<Message, ResponseMessageResponseDTO>();

    cfg.CreateMap<Message, MessageResponseDTO>()
        .ForMember(dest => dest.Responses, opt => opt.MapFrom(src => src.Responses));

    cfg.CreateMap<MessagePostDTO, Message>().ReverseMap();
    cfg.CreateMap<ResponseMessagePostDTO, ResponseMessage>().ReverseMap();

    // Location 
    cfg.CreateMap<Location, LocationResponseDTO>()
        .ForMember(dest => dest.Messages, opt => opt.MapFrom(src => src.Comments))
        .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category.ToString()));

    cfg.CreateMap<LocationPostDTO, Location>().ReverseMap();
});

//logging
builder.Logging.ClearProviders();
builder.Logging.AddLog4Net("log4net.config");

//validators
builder.Services.AddScoped<PulseMap.Interfaces.IValidatorFactory, ValidatorFactory>();
builder.Services.AddValidatorsFromAssemblyContaining<LocationPostDTOValidator>();

//repositories
builder.Services.AddScoped<ILocationRepository, LocationRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();

//helpers
//builder.Services.Configure<PasswordHasherOptions>(
//    options => options.CompatibilityMode = PasswordHasherCompatibilityMode.IdentityV3
//    );
//builder.Services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();

//services
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IMessageService, MessageService>();

// Hangfire
builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHangfireServer();

builder.Services.AddScoped<LocationExpirationService>();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.UseCors(AppAllowSpecificOrigins);

// Hangfire Dashboard
app.MapHangfireDashboard();

// Jobs
using (var scope = app.Services.CreateScope())
{
    var backgroundJobClient = scope.ServiceProvider.GetRequiredService<IBackgroundJobClient>();
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();

    // Run when app starts
    backgroundJobClient.Enqueue<LocationExpirationService>(x => x.CheckExpiredLocations());

    // Run every minute
    recurringJobManager.AddOrUpdate<LocationExpirationService>(
        "check-expired-locations",
        x => x.CheckExpiredLocations(),
        Cron.Minutely
    );
}

app.Run();
