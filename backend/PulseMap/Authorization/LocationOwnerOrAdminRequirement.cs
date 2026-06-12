using Microsoft.AspNetCore.Authorization;
using PulseMap.Domain;
using PulseMap.Domain.Enums;
using System.Security.Claims;

namespace PulseMap.Authorization;

public class LocationOwnerOrAdminRequirement : IAuthorizationRequirement {}

public class LocationOwnerOrAdminHandler : AuthorizationHandler<LocationOwnerOrAdminRequirement, Location>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        LocationOwnerOrAdminRequirement requirement,
        Location location)
    {
        var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userRole = context.User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userIdClaim))
        {
            return Task.CompletedTask;
        }

        if (userRole == UserRole.Admin.ToString())
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        if (location.OwnerId != null && location.OwnerId.ToString() == userIdClaim)
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        return Task.CompletedTask;
    }
}
