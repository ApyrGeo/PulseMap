using Microsoft.AspNetCore.Authorization;
using PulseMap.Domain.Enums;
using System.Security.Claims;

namespace PulseMap.Authorization;

public class SameUserOrAdminRequirement : IAuthorizationRequirement
{
}

public class SameUserOrAdminHandler : AuthorizationHandler<SameUserOrAdminRequirement>
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public SameUserOrAdminHandler(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, 
        SameUserOrAdminRequirement requirement)
    {
        var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userIdClaim))
        {
            return Task.CompletedTask;
        }

        // If user is Admin, grant access
        if (userRole == UserRole.Admin.ToString())
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Check if the route has an 'id' or 'userId' parameter
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext != null)
        {
            var routeData = httpContext.GetRouteData();
            
            // Check for 'id' parameter in route
            if (routeData.Values.TryGetValue("id", out var idValue) && 
                idValue?.ToString() == userIdClaim)
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }

            // Check for 'userId' query parameter
            if (httpContext.Request.Query.TryGetValue("userId", out var userIdQuery) && 
                userIdQuery.ToString() == userIdClaim)
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }
        }

        return Task.CompletedTask;
    }
}
