using CongresoApi.Data;
using CongresoApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CongresoApi.Endpoints;

public static class InscripcionEndpoints
{
    public static void MapInscripcionEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/inscripciones").WithTags("Inscripciones");

        g.MapGet("/", async (CongresoDbContext db) =>
        {
            var list = await db.Inscripciones.AsNoTracking()
                .OrderBy(i => i.Id)
                .Select(i => new { i.Id, i.UserId, i.User!.Username, i.TallerId, i.Taller!.Name, i.Taller.Horario, i.Taller.Horas })
                .ToListAsync();

            return Results.Ok(list.Select(i => new InscripcionDto(
                i.Id, i.UserId, i.Username, i.TallerId, i.Name, i.Horario, Horarios.Nombre(i.Horario), i.Horas)));
        })
        .WithSummary("Lista todas las inscripciones");

        // Solo un Alumno (UserRol = 2) puede inscribirse, y no dos veces al mismo taller.
        g.MapPost("/", async (CrearInscripcionRequest req, CongresoDbContext db) =>
        {
            var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == req.UserId);
            if (user is null)
                return Results.Problem("El usuario no existe.", statusCode: StatusCodes.Status404NotFound);
            if (user.UserRol != Roles.Alumno)
                return Results.Problem("Solo un alumno puede inscribirse a talleres.", statusCode: StatusCodes.Status403Forbidden);

            var taller = await db.Talleres.AsNoTracking().FirstOrDefaultAsync(t => t.Id == req.TallerId);
            if (taller is null)
                return Results.Problem("El taller no existe.", statusCode: StatusCodes.Status404NotFound);

            if (await db.Inscripciones.AnyAsync(i => i.UserId == req.UserId && i.TallerId == req.TallerId))
                return Results.Problem("El alumno ya está inscrito en este taller.", statusCode: StatusCodes.Status409Conflict);

            var insc = new Inscripcion { UserId = req.UserId, TallerId = req.TallerId };
            db.Inscripciones.Add(insc);
            await db.SaveChangesAsync();

            var dto = new InscripcionDto(insc.Id, user.Id, user.Username, taller.Id, taller.Name,
                                         taller.Horario, Horarios.Nombre(taller.Horario), taller.Horas);
            return Results.Created($"/api/inscripciones/{insc.Id}", dto);
        })
        .WithSummary("Inscribe a un alumno en un taller");

        // Un alumno solo puede cancelar sus propias inscripciones.
        g.MapDelete("/{id:int}", async (int id, [FromHeader(Name = "X-User-Id")] int userId, CongresoDbContext db) =>
        {
            var ownerId = await db.Inscripciones.Where(i => i.Id == id).Select(i => (int?)i.UserId).FirstOrDefaultAsync();
            if (ownerId is null) return Results.NotFound();
            if (ownerId != userId)
                return Results.Problem("Solo puedes darte de baja de tus propias inscripciones.", statusCode: StatusCodes.Status403Forbidden);

            await db.Inscripciones.Where(i => i.Id == id).ExecuteDeleteAsync();
            return Results.NoContent();
        })
        .WithSummary("Cancela una inscripción (el alumno dueño; enviar header X-User-Id)");
    }
}
