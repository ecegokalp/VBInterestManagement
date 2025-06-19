namespace InterestCalculationAPI.Models
{
    public class PaymentPlan
    {
        public int Id { get; set; }
        public int CreditId { get; set; }
        public DateTime expiryDate { get; set; }
        public double monthlyTax {  get; set; }
        public double PrincipalAmount {  get; set; }
        public double InterestAmount { get; set; }
        public double KKDF { get; set; } 
        public double BSMV { get; set; }
        public double remainingDebt { get; set; }




    }
}
