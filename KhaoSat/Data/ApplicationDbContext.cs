using Microsoft.EntityFrameworkCore;
using KhaoSat.Models;

namespace KhaoSat.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Survey> Surveys { get; set; } = null!;
        public DbSet<Question> Questions { get; set; } = null!;
        public DbSet<SurveyResponse> SurveyResponses { get; set; } = null!;
        public DbSet<Answer> Answers { get; set; } = null!;
    }
}
