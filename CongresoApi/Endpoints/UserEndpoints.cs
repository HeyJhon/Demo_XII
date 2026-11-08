using CongresoApi.Data;
using CongresoApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CongresoApi.Endpoints;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/users").WithTags("Users");

        g.MapGet("/", async (int? rol, CongresoDbContext db) =>
        {
            var q = db.Users.AsNoTracking();
            if (rol is not null) q = q.Where(u => u.UserRol == rol);
            var users = await q.OrderBy(u => u.Id).ToListAsync();
            return Results.Ok(users.Select(UserDto.From));
        })
        .WithSummary("Lista usuarios (filtro opcional por rol: 1 = Profesor, 2 = Alumno)");

        g.MapGet("/{id:int}", async (int id, CongresoDbContext db) =>
        {
            var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
            return user is null ? Results.NotFound() : Results.Ok(UserDto.From(user));
        })
        .WithSummary("Obtiene un usuario por Id");

        g.MapGet("/{id:int}/inscripciones", async (int id, CongresoDbContext db) =>
        {
            if (!await db.Users.AnyAsync(u => u.Id == id)) return Results.NotFound();

            var list = await db.Inscripciones.AsNoTracking()
                .Where(i => i.UserId == id)
                .Select(i => new { i.Id, i.UserId, i.User!.Username, i.TallerId, i.Taller!.Name, i.Taller.Horario, i.Taller.Horas })
                .ToListAsync();

            return Results.Ok(list.Select(i => new InscripcionDto(
                i.Id, i.UserId, i.Username, i.TallerId, i.Name, i.Horario, Horarios.Nombre(i.Horario), i.Horas)));
        })
        .WithSummary("Talleres en los que está inscrito un alumno");
    }
}
