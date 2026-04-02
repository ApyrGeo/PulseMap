using FluentValidation;
using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PulseMap.Authorization;
using PulseMap.Context;
using PulseMap.Domain;
using PulseMap.Domain.DTOs;
using PulseMap.Interfaces;
using PulseMap.Middlewares;
using PulseMap.Repository;
using PulseMap.Domain;
using PulseMap.Service;
using PulseMap.Service.AI;
using PulseMap.Service.AI.Description;
using PulseMap.Service.AI.LocationMatch;
using PulseMap.Service.AI.EventClustering;
using PulseMap.Service.AI.Recommendation;
using PulseMap.Service.BackgroundServices;
using PulseMap.Service.Validators;
using PulseMap.Service.WS;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Enable dynamic JSON for Npgsql globally (must be called before any Npgsql connections)
// Required for List<string> in JSONB columns and Hangfire
Npgsql.NpgsqlConnection.GlobalTypeMapper.EnableDynamicJson();

// Add services to the container.
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter your JWT token in the format: Bearer {your token}"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var AppAllowSpecificOrigins = "AllowFrontend";

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("CORS:AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:4200", "https://localhost:4200", "https://localhost:4201", "http://localhost:4201" };

        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

//database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<PulseMapContext>((sp, options) =>
{
    options.UseNpgsql(connectionString);
});

builder.Services.AddHttpContextAccessor();

//JWT Authentication & Authorization
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT Key is not configured. Add it to appsettings.json or Azure App Configuration.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("UserOrAdmin", policy => policy.RequireRole("User", "Admin"));
    options.AddPolicy("SameUserOrAdmin", policy =>
        policy.Requirements.Add(new SameUserOrAdminRequirement()));
    options.AddPolicy("LocationOwnerOrAdmin", policy =>
        policy.Requirements.Add(new LocationOwnerOrAdminRequirement()));
});

builder.Services.AddSingleton<IAuthorizationHandler, SameUserOrAdminHandler>();
builder.Services.AddSingleton<IAuthorizationHandler, LocationOwnerOrAdminHandler>();

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
        .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category != null ? src.Category.Name : "Not Set"))
        .ForMember(dest => dest.LikesCount, opt => opt.MapFrom(src => src.Likes.Count))
        .ForMember(dest => dest.IsLikedByCurrentUser, opt => opt.Ignore())
        .ForMember(dest => dest.Event, opt => opt.MapFrom(src => src.Event))
        .ForMember(dest => dest.EventAssignmentConfidence, opt => opt.MapFrom(src => src.EventAssignmentConfidence))
        .ForMember(dest => dest.ImageUrls, opt => opt.MapFrom(src => src.Images.OrderBy(i => i.Order).Select(i => i.Url).ToList()));

    cfg.CreateMap<LocationPostDTO, Location>()
        .ForMember(dest => dest.Category, opt => opt.Ignore())
        .ForMember(dest => dest.Images, opt => opt.Ignore()); // Handled manually in LocationService

    // Event
    cfg.CreateMap<Event, SimplifiedEventResponseDTO>();

    cfg.CreateMap<Event, EventResponseDTO>()
        .ForMember(dest => dest.LocationsCount, opt => opt.MapFrom(src => src.Locations.Count))
        .ForMember(dest => dest.Locations, opt => opt.MapFrom(src => src.Locations));
});

//logging
builder.Logging.ClearProviders();
builder.Logging.AddLog4Net("log4net.config");

//validators
builder.Services.AddScoped<PulseMap.Interfaces.IValidatorFactory, ValidatorFactory>();
builder.Services.AddValidatorsFromAssemblyContaining<LocationPostDTOValidator>();

//repositories
builder.Services.AddScoped<ILocationRepository, LocationRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();
builder.Services.AddScoped<IEventRepository, EventRepository>();
builder.Services.AddScoped<IInteractionRepository, InteractionRepository>();

//services
builder.Services.AddSingleton<IWebSocketNotificationService, WebSocketNotificationService>();
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<IInteractionService, InteractionService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IEventService, EventService>();

// JWT Token Service
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

// Image Service
builder.Services.AddScoped<IImageService, ImageService>();

// AI Services
builder.Services.AddScoped<IAIStatisticsService, AIStatisticsService>();
builder.Services.AddScoped<ITranslationService, TranslationService>();
builder.Services.AddScoped<IRecommendationAiScorer, RecommendationEmbeddingScorer>();

// HttpClient for Hugging Face
builder.Services.AddHttpClient("HuggingFace", client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

//AI Classifiers - Register all implementations
builder.Services.AddScoped<EmbeddingLocationClassifier>();  // Renamed from HuggingFaceLocationClassifier

// Check if OpenAI is configured before registering classifiers
var openAiKey = builder.Configuration["OpenAI:ApiKey"];
var hasOpenAiKey = !string.IsNullOrEmpty(openAiKey);

if (hasOpenAiKey)
{
    builder.Services.AddScoped<OpenAiLocationClassifier>();
    Console.WriteLine("OpenAI classifier registered");
}
else
{
    Console.WriteLine("OpenAI API key not configured - classification will not work");
}

// Composite Classifier - Try embedding-based first (cheap), then GPT (expensive)
builder.Services.AddScoped<ILocationClassifier>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<CompositeLocationClassifier>>();
    var statsService = sp.GetRequiredService<IAIStatisticsService>();
    var categoryRepository = sp.GetRequiredService<ICategoryRepository>();

    var classifiers = new List<ILocationClassifier>();

    if (hasOpenAiKey)
    {
        // Try embedding-based classification first (cheaper: ~$0.0001 vs GPT ~$0.002)
        try
        {
            classifiers.Add(sp.GetRequiredService<EmbeddingLocationClassifier>());  // 1st: OpenAI Embeddings (cheap)
            logger.LogInformation("Added EmbeddingLocationClassifier (OpenAI embeddings) as primary");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to initialize EmbeddingLocationClassifier");
        }

        // Add GPT as fallback (more expensive but more accurate)
        try
        {
            classifiers.Add(sp.GetRequiredService<OpenAiLocationClassifier>());  // 2nd: GPT (expensive, accurate)
            logger.LogInformation("Added OpenAiLocationClassifier as fallback");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to initialize OpenAI classifier");
        }

        logger.LogInformation("CompositeLocationClassifier initialized: Embeddings (cheap) → GPT (expensive) → Keyword (free)");
    }
    else
    {
        logger.LogWarning("No AI classifiers available - using keyword fallback only");
    }

    return new CompositeLocationClassifier(classifiers, logger, statsService, categoryRepository);
});

//AI Location Matchers - Register all implementations
builder.Services.AddScoped<KeywordLocationMatcher>();

if (hasOpenAiKey)
{
    builder.Services.AddScoped<EmbeddingLocationMatcher>();
    builder.Services.AddScoped<GptLocationMatcher>();
    Console.WriteLine("OpenAI matchers registered (GPT + Embeddings available)");
}
else
{
    Console.WriteLine("OpenAI matchers not configured - using keyword matching only (free)");
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

// AI Event Extractors & Clustering
if (hasOpenAiKey)
{
    builder.Services.AddScoped<GptEventExtractor>();
    builder.Services.AddScoped<EmbeddingEventExtractor>();
    Console.WriteLine("Event extractors registered (GPT + Embeddings)");
}

builder.Services.AddScoped<IEventExtractorService>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<CompositeEventExtractor>>();

    GptEventExtractor? gptExtractor = null;
    EmbeddingEventExtractor? embeddingExtractor = null;

    if (hasOpenAiKey)
    {
        try
        {
            embeddingExtractor = sp.GetRequiredService<EmbeddingEventExtractor>();
            gptExtractor = sp.GetRequiredService<GptEventExtractor>();
            logger.LogInformation("CompositeEventExtractor initialized: Embeddings → GPT");
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to initialize event extractors");
        }
    }
    else
    {
        logger.LogWarning("No event extractors available - event clustering disabled");
    }

    return new CompositeEventExtractor(logger, embeddingExtractor, gptExtractor);
});

builder.Services.AddScoped<IEventClusteringService, EventClusteringService>();

// Hangfire
builder.Services.AddHangfire(config =>
    config.UsePostgreSqlStorage(connectionString));

builder.Services.AddHangfireServer();

builder.Services.AddScoped<LocationBackGroundService>();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS must be first — before any middleware that could short-circuit the pipeline
app.UseCors(AppAllowSpecificOrigins);

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow, environment = app.Environment.EnvironmentName }));

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

if (builder.Configuration["HangFire:Running"] == "True")
{
    // Jobs
    Console.WriteLine("AAAAA");
    using (var scope = app.Services.CreateScope())
    {
        var backgroundJobClient = scope.ServiceProvider.GetRequiredService<IBackgroundJobClient>();
        var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();

        // Run when app starts
        backgroundJobClient.Enqueue<LocationBackGroundService>(x => x.CheckExpiredLocations());
        backgroundJobClient.Enqueue<LocationBackGroundService>(x => x.CheckExpiredEvents());
        backgroundJobClient.Enqueue<LocationBackGroundService>(x => x.ExtendLocationDurationByLikeCounts());

        // Run every minute
        recurringJobManager.AddOrUpdate<LocationBackGroundService>(
            "check-expired-locations",
            x => x.CheckExpiredLocations(),
            Cron.Minutely
        );
        recurringJobManager.AddOrUpdate<LocationBackGroundService>(
            "check-expired-events",
            x => x.CheckExpiredEvents(),
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
}

app.Run();
