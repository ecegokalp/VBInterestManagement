var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddControllers();

// CORS Politikasýný Geliþtirme 
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAllForDev",
            policy =>
            {
                policy.AllowAnyOrigin()  
                     .AllowAnyHeader()
                     .AllowAnyMethod();
            });
    });
}
else
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowSpecificOrigins",
            policy =>
            {
                policy.WithOrigins("http://localhost:3000", "https://siteniz.com") // Üretimde sadece belirli origin'ler
                     .AllowAnyHeader()
                     .AllowAnyMethod();
            });
    });
}

var app = builder.Build();

// HTTP Request Pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}


app.UseStaticFiles();
app.UseRouting();


app.UseCors(builder.Environment.IsDevelopment() ? "AllowAllForDev" : "AllowSpecificOrigins");

app.UseAuthorization();
app.MapRazorPages();
app.MapControllers();

app.Run();