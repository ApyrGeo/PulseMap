using Microsoft.AspNetCore.Authorization;
using PulseMap.Domain;
using PulseMap.Domain.Enums;
using System.Security.Claims;

namespace PulseMap.Authorization;

/// <summary>
/// Requirement for operations that require the user to be the location owner or an admin
/// </summary>
public class LocationOwnerOrAdminRequirement : IAuthorizationRequirement
{
}

/// <summary>
/// Handler that checks if user is location owner (via OwnerId) or admin
/// </summary>
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

        // Admin can access any location
        if (userRole == UserRole.Admin.ToString())
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Check if user owns the location (via OwnerId)
        if (location.OwnerId != null && location.OwnerId.ToString() == userIdClaim)
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        return Task.CompletedTask;
    }
}
