var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();
builder.Services.AddControllers();
builder.Services.AddScoped<InterestCalculationAPI.Data.DataBaseHandler>();

// CORS Politikasn Gelitirme 
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
                policy.WithOrigins("http://localhost:3000", "https://siteniz.com") // �retimde sadece belirli origin'ler
                     .AllowAnyHeader()
                     .AllowAnyMethod();
            });
    });
}

var app = builder.Build();

// InterestRates tablosunu ve örnek verileri oluştur (bir defa çalışır)
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<InterestCalculationAPI.Data.DataBaseHandler>();
        db.CreateInterestRatesTable();
        db.SeedInterestRatesFromJson("Data/SeedFiles/vakif_tl.json");
        db.SeedInterestRatesFromJson("Data/SeedFiles/vakif_eur.json");
        db.SeedInterestRatesFromJson("Data/SeedFiles/vakif_usd.json");
        db.InsertTanishmaKampanyasiRates();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"InterestRates tablo/örnek veri oluşturulurken hata: {ex.Message}");
    }
}

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