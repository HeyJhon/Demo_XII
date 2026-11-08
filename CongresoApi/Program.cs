using CongresoApi.Data;
using CongresoApi.Endpoints;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<CongresoDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("CongresoDb")));

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();

var app = builder.Build();

// OpenAPI + Swagger UI (habilitado siempre: es una demo)
app.MapOpenApi();                       // /openapi/v1.json
app.UseSwaggerUI(o =>
{
    o.SwaggerEndpoint("/openapi/v1.json", "Congreso ISC - TecNM Ajalpan");
    o.DocumentTitle = "Congreso ISC API";
});                                     // /swagger

// UI/UX: los archivos de la carpeta wwwroot se sirven en la raíz (/)
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapTallerEndpoints();
app.MapInscripcionEndpoints();

app.Run();
