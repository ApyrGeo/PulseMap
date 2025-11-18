using Microsoft.EntityFrameworkCore;
using PulseMap.Domain;
using System.Reflection;

namespace PulseMap.Context;

public class PulseMapContext(DbContextOptions<PulseMapContext> options) : DbContext(options)
{
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Message> Messages => Set<Message>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
