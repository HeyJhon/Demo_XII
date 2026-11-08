using CongresoApi.Data;
using Microsoft.EntityFrameworkCore;

namespace CongresoApi.Endpoints;

// "Autorización" de demo: valida que el usuario del header X-User-Id exista y tenga el rol requerido.
// Regresa null si está permitido, o el resultado de error a devolver.
public static class Auth
{
    public static async Task<IResult?> RequireRol(CongresoDbContext db, int userId, int rol, string mensaje)
    {
        var userRol = await db.Users.Where(u => u.Id == userId).Select(u => (int?)u.UserRol).FirstOrDefaultAsync();
        if (userRol is null)
            return Results.Problem("El usuario no existe.", statusCode: StatusCodes.Status401Unauthorized);
        if (userRol != rol)
            return Results.Problem(mensaje, statusCode: StatusCodes.Status403Forbidden);
        return null;
    }
}
