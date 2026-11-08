# XII Congreso de Ingeniería en Sistemas Computacionales · TecNM Campus Ajalpan

Demo de un sistema de inscripción a talleres del congreso.

- **Alumnos:** ven los talleres, se inscriben, consultan sus talleres y se dan de baja.
- **Profesores:** ven, crean, editan y eliminan talleres, y consultan a los alumnos inscritos. No pueden inscribirse.

Es un **MVP / PoC**: un solo proyecto **ASP.NET Core Web API (.NET 10)** que también sirve la interfaz web (HTML + CSS + JavaScript, sin frameworks) desde `wwwroot/`.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Backend | .NET 10 · Minimal APIs · Entity Framework Core 10 (SQL Server) |
| Documentación API | OpenAPI + Swagger UI |
| Frontend | HTML, CSS y JavaScript puro (SPA con rutas por `#hash`) |
| Base de datos | SQL Server 2019+ (Express, Developer o LocalDB) |

## Estructura

```
├── database/
│   └── CongresoISDB.sql        # Crea la base, tablas, llaves y datos de prueba
└── CongresoApi/
    ├── Program.cs              # Configuración: EF Core, Swagger, archivos estáticos
    ├── appsettings.json        # Cadena de conexión
    ├── Data/                   # DbContext
    ├── Models/                 # Entidades y DTOs
    ├── Endpoints/              # Auth, Users, Talleres, Inscripciones
    └── wwwroot/                # UI/UX
        ├── index.html          # App
        ├── estilo.html         # Guía de estilo
        ├── css/congreso.css    # Sistema de diseño
        ├── js/app.js           # Lógica de la app
        └── img/talleres/{Id}.jpg  # Flyer de cada taller (por Id)
```

## Requisitos

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- SQL Server 2019 o superior (Express, Developer o LocalDB)
- Una de estas herramientas para correr el script: **SSMS**, **Azure Data Studio** o **sqlcmd**

## Cómo levantarlo

### 1. Clonar el repositorio

```bash
git clone https://github.com/HeyJhon/Demo_XII.git
cd Demo_XII
```

### 2. Crear la base de datos

Ejecuta el script `database/CongresoISDB.sql`. Crea la base `CongresoISDB`, las tablas y los datos de prueba.

**Opción A: SSMS o Azure Data Studio.** Abre el archivo y ejecútalo (F5).

**Opción B: sqlcmd** (con autenticación de Windows):

```bash
sqlcmd -S localhost -E -C -i database/CongresoISDB.sql
```

Al final debe mostrar `User 9 · Taller 5 · Inscripcion 8`.

> ⚠️ Si las tablas ya existen, el script las **elimina y las vuelve a crear**. Sirve para reiniciar la demo a su estado original.

### 3. Configurar la cadena de conexión (solo si es necesario)

Por defecto la app se conecta a `localhost` con autenticación de Windows. Está en `CongresoApi/appsettings.json`:

```json
"ConnectionStrings": {
  "CongresoDb": "Server=localhost;Database=CongresoISDB;Trusted_Connection=True;TrustServerCertificate=True"
}
```

Si tu servidor es otro, cambia el valor:

| Caso | Cadena de conexión |
|---|---|
| SQL Server Express | `Server=localhost\\SQLEXPRESS;Database=CongresoISDB;Trusted_Connection=True;TrustServerCertificate=True` |
| LocalDB | `Server=(localdb)\\MSSQLLocalDB;Database=CongresoISDB;Trusted_Connection=True` |
| Usuario y contraseña de SQL | `Server=localhost;Database=CongresoISDB;User Id=sa;Password=TU_PASSWORD;TrustServerCertificate=True` |

> Si usas sqlcmd con un servidor distinto, cambia también `-S` en el paso 2 (por ejemplo `-S localhost\SQLEXPRESS`).

### 4. Correr la app

```bash
cd CongresoApi
dotnet run --launch-profile http
```

| Qué | URL |
|---|---|
| App web | http://localhost:5194 |
| Swagger UI | http://localhost:5194/swagger |
| Guía de estilo | http://localhost:5194/estilo.html |

## Usuarios de prueba

| Usuario | Contraseña | Rol | Inscrito en |
|---|---|---|---|
| `cesar.zarate` | `12345` | Profesor | — |
| `prof.hernandez` | `Prof2026!` | Profesor | — |
| `prof.morales` | `Prof2026!` | Profesor | — |
| `jhonnatan.flores` | `12345` | Alumno | Impresión 3D, Power BI |
| `ana.lopez` | `Alumno123` | Alumno | Impresión 3D, ESP32 |
| `carlos.garcia` | `Alumno123` | Alumno | DevSecOps |
| `maria.perez` | `Alumno123` | Alumno | ESP32 |
| `jose.martinez` | `Alumno123` | Alumno | Impresión 3D |
| `lucia.sanchez` | `Alumno123` | Alumno | DevSecOps |

### Flujo de la app

1. En el inicio, entra a **Talleres**.
2. Elige si eres **Alumno** o **Profesor**.
3. Inicia sesión. La cuenta debe corresponder al rol que elegiste.
4. Según tu rol:
   - **Alumno:** "Mis talleres" (con **Darme de baja**), "Talleres disponibles" (con **Inscribirme**) e **Info** para ver el detalle.
   - **Profesor:** listado de talleres con **Nuevo taller**, **Editar** y **Eliminar**. En el detalle ves a los alumnos inscritos.

## Modelo de datos

```
User (Id, Username, Password, UserRol)          UserRol: 1 = Profesor, 2 = Alumno
Taller (Id, Name, Description, Instructor, Horario, Horas)   Horario: 1 = Mañana, 2 = Tarde
Inscripcion (Id, UserId → User.Id, TallerId → Taller.Id)
```

`UserRol` y `Horario` son valores fijos, sin tabla catálogo. Solo `Inscripcion` tiene llaves foráneas.

## API

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Login. Regresa el usuario y su rol |
| GET | `/api/users?rol=` | Lista usuarios (filtro opcional por rol) |
| GET | `/api/users/{id}/inscripciones` | Talleres de un alumno |
| GET | `/api/talleres?horario=` | Lista talleres con su número de inscritos |
| GET | `/api/talleres/{id}` | Detalle de un taller |
| GET | `/api/talleres/{id}/alumnos` | Alumnos inscritos en un taller |
| POST | `/api/talleres` | Crea un taller · **solo Profesor** |
| PUT | `/api/talleres/{id}` | Edita un taller · **solo Profesor** |
| DELETE | `/api/talleres/{id}` | Elimina un taller y sus inscripciones · **solo Profesor** |
| GET | `/api/inscripciones` | Lista todas las inscripciones |
| POST | `/api/inscripciones` | Inscribe a un alumno · **solo Alumno**, sin duplicados |
| DELETE | `/api/inscripciones/{id}` | Da de baja una inscripción · **solo el alumno dueño** |

Las operaciones protegidas identifican al usuario con el header **`X-User-Id`**. En Swagger aparece como parámetro y la app web lo manda sola. En `CongresoApi/CongresoApi.http` hay peticiones de ejemplo.

## Notas de la demo

Esto es una prueba de concepto. **No usar en producción así como está:**

- Las contraseñas se guardan en texto plano.
- No hay tokens (JWT/cookies): el rol se valida con el header `X-User-Id`, que cualquiera puede falsificar.
- Swagger está habilitado en todos los ambientes.

Para que un taller nuevo tenga flyer, agrega su imagen en `CongresoApi/wwwroot/img/talleres/{Id}.jpg`. Si no la tiene, la app muestra una portada genérica.
