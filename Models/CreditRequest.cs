namespace InterestCalculationAPI.Models;


    public class CreditRequest
    {
        public string CreditType { get; set; }
        public double CreditAmount { get; set; }
        public int Term { get; set; }
        public double InterestRate { get; set; }
    }

