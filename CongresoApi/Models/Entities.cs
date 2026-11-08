namespace CongresoApi.Models;

// Valores fijos (sin tabla catálogo, a propósito para la demo)
public static class Roles
{
    public const int Profesor = 1;
    public const int Alumno = 2;

    public static string Nombre(int rol) => rol switch
    {
        Profesor => "Profesor",
        Alumno => "Alumno",
        _ => "Desconocido"
    };
}

public static class Horarios
{
    public const int Manana = 1;
    public const int Tarde = 2;

    public static bool EsValido(int horario) => horario is Manana or Tarde;

    public static string Nombre(int horario) => horario switch
    {
        Manana => "Mañana",
        Tarde => "Tarde",
        _ => "Desconocido"
    };
}

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public int UserRol { get; set; }
}

public class Taller
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public string Instructor { get; set; } = "";
    public int Horario { get; set; }
    public int Horas { get; set; }

    public List<Inscripcion> Inscripciones { get; set; } = [];
}

public class Inscripcion
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int TallerId { get; set; }

    public User? User { get; set; }
    public Taller? Taller { get; set; }
}
