namespace InterestCalculationAPI.Models
{
    public class Credit
    {
        public int Id { get; set; }
        public string creditType { get; set; }
        public double creditAmount { get; set; }
        public int Term { get; set; }
        public double interestRate { get; set; }

        public DateTime StartDate { get; set; } = DateTime.Now.Date; // kullanıcıdan gelmeyecek backend'de set edilecek
    }
}
