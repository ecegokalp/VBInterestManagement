namespace InterestCalculationAPI.Models
{
    public class InstallmentRequest
    {
        public string CreditType { get; set; }
        public double MonthlyInstallment { get; set; }
        public int Term { get; set; }
        public double InterestRate { get; set; }
    }
}
