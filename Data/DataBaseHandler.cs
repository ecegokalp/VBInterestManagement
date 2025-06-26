using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using InterestCalculationAPI.Controllers;
using InterestCalculationAPI.Models;
using Microsoft.Data.Sqlite;
namespace InterestCalculationAPI.Data
{
    public class DataBaseHandler
    {
        private const string ConnectionStr = "Data Source=interest.db";

        public DataBaseHandler()
        {
            using var conn = new SqliteConnection(ConnectionStr);
            conn.Open();


            //payment table
            var paymentcmd = conn.CreateCommand();
            paymentcmd.CommandText = @"
        CREATE TABLE IF NOT EXISTS PaymentPlan(
        Id INTEGER  PRIMARY KEY AUTOINCREMENT,
        CreditId INTEGER,
        expiriyDate TEXT,
        monthlyTax REAL,
        PrincipalAmount REAL,
        InterestAmount REAL,
        KKDF REAL,
        BSMV REAL,
        remainingDebt REAL);";
            paymentcmd.ExecuteNonQuery();
        }
    }
}
