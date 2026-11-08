using CongresoApi.Models;
using Microsoft.EntityFrameworkCore;

namespace CongresoApi.Data;

// Mapea las tablas que ya existen en CongresoISDB (no usamos migraciones).
public class CongresoDbContext(DbContextOptions<CongresoDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Taller> Talleres => Set<Taller>();
    public DbSet<Inscripcion> Inscripciones => Set<Inscripcion>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<User>(e =>
        {
            e.ToTable("User");
            e.Property(x => x.Username).HasMaxLength(50).IsUnicode(false);
            e.Property(x => x.Password).HasMaxLength(20).IsUnicode(false);
        });

        mb.Entity<Taller>(e =>
        {
            e.ToTable("Taller");
            e.Property(x => x.Name).HasMaxLength(50).IsUnicode(false);
            e.Property(x => x.Description).HasMaxLength(200).IsUnicode(false);
            e.Property(x => x.Instructor).HasMaxLength(100).IsUnicode(false);
        });

        mb.Entity<Inscripcion>(e =>
        {
            e.ToTable("Inscripcion");
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Taller).WithMany(t => t.Inscripciones).HasForeignKey(x => x.TallerId);
        });
    }
}
