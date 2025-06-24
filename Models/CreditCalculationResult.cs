namespace InterestCalculationAPI.Models
{
    public class CreditCalculationResult
    {
        public double TotalPayment { get; set; }
        public double TotalKKDF { get; set; }
        public double TotalBSMV { get; set; }
        public double MonthlyPayment { get; set; }
        public List<PaymentPlan> PaymentPlans { get; set; }
    }
}


