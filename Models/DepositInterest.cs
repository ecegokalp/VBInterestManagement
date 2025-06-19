namespace InterestCalculationAPI.Models
{
    public class DepositInterest
    {
        public int Id { get; set; }
        public string depositType { get; set; }
        public string currency {get; set; }
        public int expiryTime { get; set; }
        public double depositAmount { get; set; }

  }
}
