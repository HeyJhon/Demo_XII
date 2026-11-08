namespace CongresoApi.Models;

// --- Requests ---
public record LoginRequest(string Username, string Password);

public record CrearTallerRequest(string Name, string? Description, string Instructor, int Horario, int Horas);

public record CrearInscripcionRequest(int UserId, int TallerId);

// --- Responses (nunca exponemos el Password) ---
public record UserDto(int Id, string Username, int UserRol, string RolNombre)
{
    public static UserDto From(User u) => new(u.Id, u.Username, u.UserRol, Roles.Nombre(u.UserRol));
}

public record TallerDto(int Id, string Name, string? Description, string Instructor,
                        int Horario, string HorarioNombre, int Horas, int Inscritos);

public record InscripcionDto(int Id, int UserId, string Username, int TallerId, string TallerName,
                             int Horario, string HorarioNombre, int Horas);
