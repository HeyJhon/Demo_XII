using CongresoApi.Data;
using CongresoApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CongresoApi.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/auth").WithTags("Auth");

        // Login simple de demo: compara usuario/contraseña en texto plano y regresa el usuario con su rol.
        g.MapPost("/login", async (LoginRequest req, CongresoDbContext db) =>
        {
            var user = await db.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Username == req.Username && u.Password == req.Password);

            return user is null
                ? Results.Problem("Usuario o contraseña incorrectos.", statusCode: StatusCodes.Status401Unauthorized)
                : Results.Ok(UserDto.From(user));
        })
        .WithSummary("Inicia sesión y regresa el usuario con su rol (1 = Profesor, 2 = Alumno)");
    }
}
