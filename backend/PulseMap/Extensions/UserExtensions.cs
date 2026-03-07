using System.Security.Claims;
using PulseMap.Domain.Enums;

namespace PulseMap.Extensions;

public static class UserExtensions
{
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    public static string GetUserRole(this ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.Role)?.Value ?? "User";
    }

    public static bool IsAdmin(this ClaimsPrincipal user)
    {
        return user.GetUserRole() == UserRole.Admin.ToString();
    }

    public static bool IsOwnerOrAdmin(this ClaimsPrincipal user, int? ownerId)
    {
        if (user.IsAdmin())
            return true;

        if (ownerId == null)
            return false;

        return user.GetUserId() == ownerId.Value;
    }
}
