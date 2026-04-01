using Microsoft.EntityFrameworkCore;
using KhaoSat.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// Register DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options => 
    options.UseSqlite("Data Source=KhaoSat.db"));

// Enable CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

// Register Repositories and Services
builder.Services.AddScoped(typeof(KhaoSat.Repositories.IRepository<>), typeof(KhaoSat.Repositories.Repository<>));
builder.Services.AddScoped<KhaoSat.Services.ISurveyService, KhaoSat.Services.SurveyService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");

app.UseDefaultFiles(); 
app.UseStaticFiles(); 
app.UseAuthorization();

app.MapControllers();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    db.Database.EnsureCreated();
    
    // Seed initial data if empty
    if (!db.Surveys.Any())
    {
        db.Surveys.Add(new KhaoSat.Models.Survey
        {
            Title = "Khảo sát ý kiến khách hàng",
            Description = "Chúng tôi muốn lắng nghe trải nghiệm của bạn về dịch vụ này.",
            Questions = new List<KhaoSat.Models.Question>
            {
                new() { Text = "Mức độ hài lòng của bạn về dịch vụ?", Type = "rating" },
                new() { Text = "Điều gì bạn thích nhất?", Type = "text" },
                new() { Text = "Bạn có giới thiệu chúng tôi cho bạn bè không?", Type = "choice", Options = "Chắc chắn rồi|Có thể|Không" }
            }
        });
        db.SaveChanges();
    }
}

app.Run();
