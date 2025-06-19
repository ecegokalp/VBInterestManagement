using System.Security.Cryptography.X509Certificates;
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

            //credit table
            var creditcmd = conn.CreateCommand();
            creditcmd.CommandText = @"
        CREATE TABLE IF NOT EXISTS Credit(
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        creditType TEXT,
        creditAmount REAL,
        Term INTEGER,
        interestRate REAL,
        StartDate TEXT);";
            creditcmd.ExecuteNonQuery();
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
        public List<PaymentPlan> GeneratePaymentPlan(string CreditType, double creditAmount, int term, double monthlyRate)
        {
            var result = new List<PaymentPlan>();
            double remainingDebt = creditAmount;

            double monthlyPayment = (creditAmount * monthlyRate * Math.Pow(1 + monthlyRate, term)) /
                                    (Math.Pow(1 + monthlyRate, term) - 1);

            for (int i = 0; i < term; i++)
            {
                double interest = remainingDebt * monthlyRate;
                double kkdf = (CreditType == "Konut Kredisi") ? 0 : interest * 0.15;
                double bsmv = (CreditType == "Konut Kredisi") ? 0 : interest * 0.15;
                double principal = monthlyPayment - interest;
                remainingDebt -= principal;

                result.Add(new PaymentPlan
                {
                    expiryDate = DateTime.Now.AddMonths(i + 1),
                    monthlyTax = monthlyPayment,
                    PrincipalAmount = principal,
                    InterestAmount = interest,
                    KKDF = kkdf,
                    BSMV = bsmv,
                    remainingDebt = remainingDebt
                });

            }

            return result;
        }



    }
}