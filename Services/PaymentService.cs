using InterestCalculationAPI.Models;
using InterestCalculationAPI.Controllers;

namespace InterestCalculationAPI.Services
{
    public class PaymentService
    {
        public CreditCalculationResult GeneratePaymentPlan(CreditType creditType, double creditAmount, int term, double monthlyRate)
        {
            var result = new List<PaymentPlan>();
            double remainingDebt = creditAmount;
            double totalPayment = 0, totalKKDF = 0, totalBSMV = 0;

            
            const double KKDF = 0.15;
            const double BSMV = 0.15;

            bool isKonutKredisi = creditType == CreditType.KonutKredisi;
            double taxMultiplier = isKonutKredisi ? 1.0 : (1 + KKDF + BSMV);

            // kkdf bsmv eklenmiş faiz oranı sadece taksit hesaplarken kullanıyorum
            double effectiveRate = monthlyRate * taxMultiplier;

            //aylık sabit taksit (annuite formülü)
            double monthlyInstallment = creditAmount * effectiveRate * Math.Pow(1 + effectiveRate, term) /
                                        (Math.Pow(1 + effectiveRate, term) - 1);
            monthlyInstallment = Math.Round(monthlyInstallment, 2);

            //virgülden sonraki iki basamağa yuvarla
            double Round2(double val) => Math.Round(val, 2);

            for (int i = 0; i < term; i++)
            {
                double interest = Round2(remainingDebt * monthlyRate);
                double kkdf = isKonutKredisi ? 0 : Round2(interest * KKDF);
                double bsmv = isKonutKredisi ? 0 : Round2(interest * BSMV);

               
                double principal = Round2(monthlyInstallment - interest - kkdf - bsmv);

                remainingDebt = Round2(remainingDebt - principal);
                if (remainingDebt < 0.01) remainingDebt = 0;

                // ödeme planına ekle
                result.Add(new PaymentPlan
                {
                    expiryDate = DateTime.Now.AddMonths(i + 1),
                    monthlyTax = monthlyInstallment,
                    PrincipalAmount = principal,
                    InterestAmount = interest,
                    KKDF = kkdf,
                    BSMV = bsmv,
                    remainingDebt = remainingDebt
                });

                // toplam
                totalPayment += monthlyInstallment;
                totalKKDF += kkdf;
                totalBSMV += bsmv;
            }

            return new CreditCalculationResult
            {
                MonthlyPayment = Round2(totalPayment / term),
                TotalPayment = Round2(totalPayment),
                TotalKKDF = Round2(totalKKDF),
                TotalBSMV = Round2(totalBSMV),
                PaymentPlans = result
            };
        }
    }
}