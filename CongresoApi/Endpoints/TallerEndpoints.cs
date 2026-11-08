using CongresoApi.Data;
using CongresoApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CongresoApi.Endpoints;

public static class TallerEndpoints
{
    public static void MapTallerEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/talleres").WithTags("Talleres");

        g.MapGet("/", async (int? horario, CongresoDbContext db) =>
        {
            var q = db.Talleres.AsNoTracking();
            if (horario is not null) q = q.Where(t => t.Horario == horario);
            return Results.Ok(await ProjectToDto(q.OrderBy(t => t.Id)).ToListAsync());
        })
        .WithSummary("Lista talleres (filtro opcional por horario: 1 = Mañana, 2 = Tarde)");

        g.MapGet("/{id:int}", async (int id, CongresoDbContext db) =>
        {
            var taller = await ProjectToDto(db.Talleres.AsNoTracking().Where(t => t.Id == id)).FirstOrDefaultAsync();
            return taller is null ? Results.NotFound() : Results.Ok(taller);
        })
        .WithSummary("Obtiene un taller por Id");

        g.MapGet("/{id:int}/alumnos", async (int id, CongresoDbContext db) =>
        {
            if (!await db.Talleres.AnyAsync(t => t.Id == id)) return Results.NotFound();

            var alumnos = await db.Inscripciones.AsNoTracking()
                .Where(i => i.TallerId == id)
                .Select(i => i.User!)
                .OrderBy(u => u.Username)
                .ToListAsync();

            return Results.Ok(alumnos.Select(UserDto.From));
        })
        .WithSummary("Alumnos inscritos en un taller");

        // Las operaciones de escritura son solo para Profesor (UserRol = 1).
        // Para la demo, el usuario que hace la petición se manda en el header X-User-Id.
        g.MapPost("/", async (CrearTallerRequest req, [FromHeader(Name = "X-User-Id")] int userId, CongresoDbContext db) =>
        {
            if (await Auth.RequireRol(db, userId, Roles.Profesor, "Solo un profesor puede crear talleres.") is { } denied)
                return denied;

            var errores = Validar(req);
            if (errores.Count > 0) return Results.ValidationProblem(errores);

            var taller = new Taller();
            Aplicar(taller, req);
            db.Talleres.Add(taller);
            await db.SaveChangesAsync();

            return Results.Created($"/api/talleres/{taller.Id}", ToDto(taller, 0));
        })
        .WithSummary("Crea un taller (solo Profesor; enviar header X-User-Id)");

        g.MapPut("/{id:int}", async (int id, CrearTallerRequest req, [FromHeader(Name = "X-User-Id")] int userId, CongresoDbContext db) =>
        {
            if (await Auth.RequireRol(db, userId, Roles.Profesor, "Solo un profesor puede editar talleres.") is { } denied)
                return denied;

            var taller = await db.Talleres.FirstOrDefaultAsync(t => t.Id == id);
            if (taller is null) return Results.NotFound();

            var errores = Validar(req);
            if (errores.Count > 0) return Results.ValidationProblem(errores);

            Aplicar(taller, req);
            await db.SaveChangesAsync();

            var inscritos = await db.Inscripciones.CountAsync(i => i.TallerId == id);
            return Results.Ok(ToDto(taller, inscritos));
        })
        .WithSummary("Edita un taller (solo Profesor; enviar header X-User-Id)");

        // Al eliminar un taller también se eliminan sus inscripciones (la FK no tiene cascada).
        g.MapDelete("/{id:int}", async (int id, [FromHeader(Name = "X-User-Id")] int userId, CongresoDbContext db) =>
        {
            if (await Auth.RequireRol(db, userId, Roles.Profesor, "Solo un profesor puede eliminar talleres.") is { } denied)
                return denied;

            if (!await db.Talleres.AnyAsync(t => t.Id == id)) return Results.NotFound();

            await using var tx = await db.Database.BeginTransactionAsync();
            await db.Inscripciones.Where(i => i.TallerId == id).ExecuteDeleteAsync();
            await db.Talleres.Where(t => t.Id == id).ExecuteDeleteAsync();
            await tx.CommitAsync();

            return Results.NoContent();
        })
        .WithSummary("Elimina un taller y sus inscripciones (solo Profesor; enviar header X-User-Id)");
    }

    private static void Aplicar(Taller t, CrearTallerRequest r)
    {
        t.Name = r.Name.Trim();
        t.Description = string.IsNullOrWhiteSpace(r.Description) ? null : r.Description.Trim();
        t.Instructor = r.Instructor.Trim();
        t.Horario = r.Horario;
        t.Horas = r.Horas;
    }

    private static TallerDto ToDto(Taller t, int inscritos) =>
        new(t.Id, t.Name, t.Description, t.Instructor, t.Horario, Horarios.Nombre(t.Horario), t.Horas, inscritos);

    private static IQueryable<TallerDto> ProjectToDto(IQueryable<Taller> q) =>
        q.Select(t => new TallerDto(
            t.Id, t.Name, t.Description, t.Instructor, t.Horario,
            t.Horario == Horarios.Manana ? "Mañana" : t.Horario == Horarios.Tarde ? "Tarde" : "Desconocido",
            t.Horas, t.Inscripciones.Count));

    private static Dictionary<string, string[]> Validar(CrearTallerRequest r)
    {
        var e = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(r.Name) || r.Name.Trim().Length > 50)
            e["name"] = ["Requerido, máximo 50 caracteres."];
        if (r.Description is not null && r.Description.Trim().Length > 200)
            e["description"] = ["Máximo 200 caracteres."];
        if (string.IsNullOrWhiteSpace(r.Instructor) || r.Instructor.Trim().Length > 100)
            e["instructor"] = ["Requerido, máximo 100 caracteres."];
        if (!Horarios.EsValido(r.Horario))
            e["horario"] = ["Debe ser 1 (Mañana) o 2 (Tarde)."];
        if (r.Horas <= 0)
            e["horas"] = ["Debe ser mayor a 0."];
        return e;
    }
}
