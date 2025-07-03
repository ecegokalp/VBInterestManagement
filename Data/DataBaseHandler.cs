using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System.Globalization;
namespace InterestCalculationAPI.Data
{
    public class DataBaseHandler
    {
        private readonly string _connectionStr = string.Empty;

        public DataBaseHandler(IConfiguration configuration)
        {
            _connectionStr = configuration.GetConnectionString("DefaultConnection");
        }

        public void CreateInterestRatesTable()
        {
            using var conn = new SqlConnection(_connectionStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='InterestRates' AND xtype='U')
                CREATE TABLE InterestRates (
                    Id INT IDENTITY(1,1) PRIMARY KEY,
                    MinAmount FLOAT NOT NULL,
                    MaxAmount FLOAT NOT NULL,
                    MinTerm INT NOT NULL,
                    MaxTerm INT NOT NULL,
                    Rate FLOAT NOT NULL,
                    Currency NVARCHAR(10) NOT NULL,
                    ProductType NVARCHAR(50) NOT NULL
                );";
            cmd.ExecuteNonQuery();
        }
        public double? GetInterestRate(double amount, int term, string currency = "TL", string productType = "standart")
        {
            var normCurrency = (currency ?? "TL").Trim().ToLower();
            var normProductType = (productType ?? "standart").Trim().ToLower();
            Console.WriteLine($"[GetInterestRate] amount={amount}, term={term}, currency={normCurrency}, productType={normProductType}");

            using var conn = new SqlConnection(_connectionStr);
            conn.Open();
            var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                SELECT TOP 1 Rate FROM InterestRates
                WHERE @amount >= MinAmount AND @amount <= MaxAmount
                  AND @term >= MinTerm AND @term <= MaxTerm
                  AND LOWER(Currency) = @currency
                  AND LOWER(ProductType) = @productType
            ";
            cmd.Parameters.AddWithValue("@amount", amount);
            cmd.Parameters.AddWithValue("@term", term);
            cmd.Parameters.AddWithValue("@currency", normCurrency);
            cmd.Parameters.AddWithValue("@productType", normProductType);

            Console.WriteLine($"[GetInterestRate] SQL: {cmd.CommandText}");

            var result = cmd.ExecuteScalar();
            if (result != null && result != DBNull.Value)
                return Convert.ToDouble(result);
            else
                return null; 
        }

        public class FaizOraniModel
        {
            public double MinAmount { get; set; }
            public double MaxAmount { get; set; }
            public int MinTerm { get; set; }
            public int MaxTerm { get; set; }
            public double Rate { get; set; }
            public string Currency { get; set; } = string.Empty;
            public string ProductType { get; set; } = string.Empty;
        }

        public class InterestRateJson
        {
            public string TermDaysStart { get; set; }
            public string TermDaysEnd { get; set; }
            public string CurrentInterestRate { get; set; }
            public string AmountStart { get; set; }
            public string AmountEnd { get; set; }
        }
        public class DepositInfo
        {
            public string CurrencyCode { get; set; }
            public string ProductType { get; set; }
            public List<InterestRateJson> InterestRates { get; set; }
        }
        public class DataRoot
        {
            public DepositInfo DepositInfo { get; set; }
        }
        public class RootObject
        {
            public DataRoot Data { get; set; }
        }

        public void SeedInterestRatesFromJson(string filePath)
        {
            Console.WriteLine("Seed edilen dosya: " + filePath);
            Console.WriteLine("Çalışma dizini: " + System.IO.Directory.GetCurrentDirectory());
            var json = System.IO.File.ReadAllText(filePath);
            var root = JsonConvert.DeserializeObject<RootObject>(json);

            if (root == null) { Console.WriteLine("JSON parse hatası! Dosya: " + filePath); return; }

            using var conn = new SqlConnection(_connectionStr);
            conn.Open();
            var productType = root.Data.DepositInfo.ProductType;
            var currency = root.Data.DepositInfo.CurrencyCode;

            var clearCmd = conn.CreateCommand();
            clearCmd.CommandText = "DELETE FROM InterestRates WHERE ProductType = @ProductType AND Currency = @Currency";
            clearCmd.Parameters.AddWithValue("@ProductType", productType);
            clearCmd.Parameters.AddWithValue("@Currency", currency);
            clearCmd.ExecuteNonQuery();


            foreach (var rate in root.Data.DepositInfo.InterestRates)
            {
                try
                {
                    var cmd = conn.CreateCommand();
                    cmd.CommandText = @"
                        INSERT INTO InterestRates (MinAmount, MaxAmount, MinTerm, MaxTerm, Rate, Currency, ProductType)
                        VALUES (@MinAmount, @MaxAmount, @MinTerm, @MaxTerm, @Rate, @Currency, @ProductType)";
                    cmd.Parameters.AddWithValue("@MinAmount", double.Parse(rate.AmountStart, CultureInfo.InvariantCulture));
                    cmd.Parameters.AddWithValue("@MaxAmount", double.Parse(rate.AmountEnd, CultureInfo.InvariantCulture));
                    cmd.Parameters.AddWithValue("@MinTerm", int.Parse(rate.TermDaysStart, CultureInfo.InvariantCulture));
                    cmd.Parameters.AddWithValue("@MaxTerm", int.Parse(rate.TermDaysEnd, CultureInfo.InvariantCulture));
                    cmd.Parameters.AddWithValue("@Rate", double.Parse(rate.CurrentInterestRate, CultureInfo.InvariantCulture));
                    cmd.Parameters.AddWithValue("@Currency", root.Data.DepositInfo.CurrencyCode);
                    cmd.Parameters.AddWithValue("@ProductType", root.Data.DepositInfo.ProductType);
                    cmd.ExecuteNonQuery();
                    Console.WriteLine($"Eklendi: {rate.AmountStart}-{rate.AmountEnd} {rate.TermDaysStart}-{rate.TermDaysEnd} {root.Data.DepositInfo.CurrencyCode} {root.Data.DepositInfo.ProductType}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine("SQL Hatası: " + ex.Message);
                }
            }
        }

        public void InsertTanishmaKampanyasiRates()
        {
            var rates = new List<FaizOraniModel>
            {
                // TL
                new FaizOraniModel { MinAmount = 0, MaxAmount = 49999, MinTerm = 32, MaxTerm = 45, Rate = 5, Currency = "TL", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 50000, MaxAmount = 2500000, MinTerm = 32, MaxTerm = 45, Rate = 48.5, Currency = "TL", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 0, MaxAmount = 49999, MinTerm = 46, MaxTerm = 91, Rate = 5, Currency = "TL", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 50000, MaxAmount = 25000000, MinTerm = 46, MaxTerm = 91, Rate = 45, Currency = "TL", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 0, MaxAmount = 49999, MinTerm = 92, MaxTerm = 100, Rate = 5, Currency = "TL", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 0, MaxAmount = 49999, MinTerm = 92, MaxTerm = 100, Rate = 45.5, Currency = "TL", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 0, MaxAmount = 49999, MinTerm = 101, MaxTerm = 366, Rate = 5, Currency = "TL", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 50000, MaxAmount = 25000000, MinTerm = 101, MaxTerm = 366, Rate = 30, Currency = "TL", ProductType = "tanışma kampanyası" },

                // USD
                new FaizOraniModel { MinAmount = 0, MaxAmount = 49999, MinTerm = 32, MaxTerm = 45, Rate = 1.2, Currency = "USD", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 50000, MaxAmount = 2500000, MinTerm = 32, MaxTerm = 45, Rate = 2.1, Currency = "USD", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 0, MaxAmount = 49999, MinTerm = 46, MaxTerm = 91, Rate = 1.2, Currency = "USD", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 50000, MaxAmount = 25000000, MinTerm = 46, MaxTerm = 91, Rate = 2.3, Currency = "USD", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 0, MaxAmount = 49999, MinTerm = 92, MaxTerm = 100, Rate = 1.2, Currency = "TL", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 0, MaxAmount = 49999, MinTerm = 92, MaxTerm = 100, Rate = 2.5, Currency = "TL", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 0, MaxAmount = 49999, MinTerm = 101, MaxTerm = 366, Rate = 1.2, Currency = "USD", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 50000, MaxAmount = 25000000, MinTerm = 101, MaxTerm = 366, Rate = 2.8, Currency = "USD", ProductType = "tanışma kampanyası" },

                // EUR
                new FaizOraniModel { MinAmount = 0, MaxAmount = 49999, MinTerm = 32, MaxTerm = 45, Rate = 0.8, Currency = "EUR", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 50000, MaxAmount = 2500000, MinTerm = 32, MaxTerm = 45, Rate = 1.5, Currency = "EUR", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 0, MaxAmount = 49999, MinTerm = 46, MaxTerm = 91, Rate = 0.8, Currency = "EUR", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 50000, MaxAmount = 25000000, MinTerm = 46, MaxTerm = 91, Rate = 1.7, Currency = "EUR", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 0, MaxAmount = 49999, MinTerm = 92, MaxTerm = 100, Rate = 0.8, Currency = "TL", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 0, MaxAmount = 49999, MinTerm = 92, MaxTerm = 100, Rate = 1.9, Currency = "TL", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 0, MaxAmount = 49999, MinTerm = 101, MaxTerm = 366, Rate = 1.0, Currency = "EUR", ProductType = "tanışma kampanyası" },
                new FaizOraniModel { MinAmount = 50000, MaxAmount = 25000000, MinTerm = 101, MaxTerm = 366, Rate = 2.1, Currency = "EUR", ProductType = "tanışma kampanyası" }
            };

            using var conn = new SqlConnection(_connectionStr);
            conn.Open();
 foreach (var oran in rates)
            {
                var checkCmd = conn.CreateCommand();
                checkCmd.CommandText = @"
                    SELECT COUNT(*) FROM InterestRates
                    WHERE MinAmount = @MinAmount AND MaxAmount = @MaxAmount
                      AND MinTerm = @MinTerm AND MaxTerm = @MaxTerm
                      AND Rate = @Rate
                      AND Currency = @Currency
                      AND ProductType = @ProductType";
                checkCmd.Parameters.AddWithValue("@MinAmount", oran.MinAmount);
                checkCmd.Parameters.AddWithValue("@MaxAmount", oran.MaxAmount);
                checkCmd.Parameters.AddWithValue("@MinTerm", oran.MinTerm);
                checkCmd.Parameters.AddWithValue("@MaxTerm", oran.MaxTerm);
                checkCmd.Parameters.AddWithValue("@Rate", oran.Rate);
                checkCmd.Parameters.AddWithValue("@Currency", oran.Currency);
                checkCmd.Parameters.AddWithValue("@ProductType", oran.ProductType);

                var result = checkCmd.ExecuteScalar();
                int count = Convert.ToInt32(result);
                if (count == 0)
                {
                    var cmd = conn.CreateCommand();
                    cmd.CommandText = @"
                        INSERT INTO InterestRates (MinAmount, MaxAmount, MinTerm, MaxTerm, Rate, Currency, ProductType)
                        VALUES (@MinAmount, @MaxAmount, @MinTerm, @MaxTerm, @Rate, @Currency, @ProductType)";
                    cmd.Parameters.AddWithValue("@MinAmount", oran.MinAmount);
                    cmd.Parameters.AddWithValue("@MaxAmount", oran.MaxAmount);
                    cmd.Parameters.AddWithValue("@MinTerm", oran.MinTerm);
                    cmd.Parameters.AddWithValue("@MaxTerm", oran.MaxTerm);
                    cmd.Parameters.AddWithValue("@Rate", oran.Rate);
                    cmd.Parameters.AddWithValue("@Currency", oran.Currency);
                    cmd.Parameters.AddWithValue("@ProductType", oran.ProductType);
                    cmd.ExecuteNonQuery();
                }
            }
        }
    }
}
