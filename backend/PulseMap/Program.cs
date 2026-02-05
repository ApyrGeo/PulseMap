using FluentValidation;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PulseMap.Context;
using PulseMap.Domain;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;
using PulseMap.Middlewares;
using PulseMap.Repository;
using PulseMap.Service;
using PulseMap.Service.AI;
using PulseMap.Service.BackgroundServices;
using PulseMap.Service.Validators;
using PulseMap.Service.WS;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var AppAllowSpecificOrigins = "AllowFrontend";

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
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
        .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category.ToString()))
        .ForMember(dest => dest.LikesCount, opt => opt.MapFrom(src => src.Likes.Count))
        .ForMember(dest => dest.IsLikedByCurrentUser, opt => opt.Ignore());

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
builder.Services.AddSingleton<IWebSocketNotificationService, WebSocketNotificationService>();
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IMessageService, MessageService>();

// HttpClient for Hugging Face
builder.Services.AddHttpClient("HuggingFace", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

//AI Classifiers - Register all implementations
builder.Services.AddScoped<HuggingFaceLocationClassifier>();

// Check if OpenAI is configured before registering classifiers
var openAiKey = builder.Configuration["OpenAI:ApiKey"];
var hasOpenAiKey = !string.IsNullOrEmpty(openAiKey);

if (hasOpenAiKey)
{
    builder.Services.AddScoped<OpenAiLocationClassifier>();
    // builder.Services.AddScoped<AzureOpenAiLocationClassifier>(); // Not used anymore
    Console.WriteLine("✅ OpenAI classifier registered");
}
else
{
    Console.WriteLine("⚠️ OpenAI API key not configured - using HuggingFace only (free)");
}

// Composite Classifier - Tries classifiers in order with automatic fallback
builder.Services.AddScoped<ILocationClassifier>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<CompositeLocationClassifier>>();
    
    // Always include HuggingFace (free)
    var classifiers = new List<ILocationClassifier>
    {
        sp.GetRequiredService<HuggingFaceLocationClassifier>()  // 1st: Free, fast
    };

    // Add OpenAI if available
    if (hasOpenAiKey)
    {
        try
        {
            classifiers.Add(sp.GetRequiredService<OpenAiLocationClassifier>());  // 2nd: Paid, reliable
            logger.LogInformation("CompositeLocationClassifier initialized with HuggingFace + OpenAI");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to initialize OpenAI classifier, using HuggingFace only");
        }
    }
    else
    {
        logger.LogInformation("CompositeLocationClassifier initialized with HuggingFace only (free)");
    }
    
    return new CompositeLocationClassifier(classifiers, logger);
});

//AI Location Matchers - Register all implementations
builder.Services.AddScoped<KeywordLocationMatcher>();

if (hasOpenAiKey)
{
    builder.Services.AddScoped<EmbeddingLocationMatcher>();
    builder.Services.AddScoped<GptLocationMatcher>();
    Console.WriteLine("✅ OpenAI matchers registered (GPT + Embeddings available)");
}
else
{
    Console.WriteLine("⚠️ OpenAI matchers not configured - using keyword matching only (free)");
}

// Composite Location Matcher - Uses available matchers with keyword fallback
builder.Services.AddScoped<ILocationMatcher>(sp =>
{
    var keywordMatcher = sp.GetRequiredService<KeywordLocationMatcher>();
    var logger = sp.GetRequiredService<ILogger<CompositeLocationMatcher>>();

    EmbeddingLocationMatcher? embeddingMatcher = null;
    GptLocationMatcher? gptMatcher = null;

    if (hasOpenAiKey)
    {
        try
        {
            embeddingMatcher = sp.GetRequiredService<EmbeddingLocationMatcher>();
            gptMatcher = sp.GetRequiredService<GptLocationMatcher>();
            logger.LogInformation("CompositeLocationMatcher initialized with GPT + Embeddings + Keyword");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to initialize OpenAI matchers, using keyword matching only");
        }
    }
    else
    {
        logger.LogInformation("CompositeLocationMatcher initialized with Keyword matching only (free)");
    }

    return new CompositeLocationMatcher(keywordMatcher, logger, embeddingMatcher, gptMatcher);
});

// Alternative: Use a single classifier directly (no fallback)
// builder.Services.AddScoped<ILocationClassifier, HuggingFaceLocationClassifier>();
// builder.Services.AddScoped<ILocationClassifier, OpenAiLocationClassifier>();
// builder.Services.AddScoped<ILocationClassifier, AzureOpenAiLocationClassifier>();

// Hangfire
builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHangfireServer();

builder.Services.AddScoped<LocationBackGroundService>();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseHttpsRedirection();

// CORS must be before Authorization and MapControllers
app.UseCors(AppAllowSpecificOrigins);

app.UseAuthorization();

app.MapControllers();

// WS
app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromSeconds(120),
});

app.Map("/ws", async context =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = 400;
        return;
    }

    var webSocket = await context.WebSockets.AcceptWebSocketAsync();
    var notifier = context.RequestServices.GetRequiredService<IWebSocketNotificationService>();
    await notifier.HandleClientAsync(webSocket, context.RequestAborted);
});

// Hangfire Dashboard
app.MapHangfireDashboard();

// Jobs
using (var scope = app.Services.CreateScope())
{
    var backgroundJobClient = scope.ServiceProvider.GetRequiredService<IBackgroundJobClient>();
    var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();

    // Run when app starts
    backgroundJobClient.Enqueue<LocationBackGroundService>(x => x.CheckExpiredLocations());
    backgroundJobClient.Enqueue<LocationBackGroundService>(x => x.ExtendLocationDurationByLikeCounts());

    // Run every minute
    recurringJobManager.AddOrUpdate<LocationBackGroundService>(
        "check-expired-locations",
        x => x.CheckExpiredLocations(),
        Cron.Minutely
    );
    recurringJobManager.AddOrUpdate<LocationBackGroundService>(
        "extend-duration-by-likes",
        x => x.ExtendLocationDurationByLikeCounts(),
        Cron.Daily);

    // Check and merge duplicate locations every 24 hours
    recurringJobManager.AddOrUpdate<LocationBackGroundService>(
        "check-merge-duplicate-locations",
        x => x.CheckAndMergeDuplicateLocations(),
        Cron.Daily);
}

app.Run();
