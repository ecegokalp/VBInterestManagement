using Microsoft.AspNetCore.Mvc;
using InterestCalculationAPI.Services;
using InterestCalculationAPI.Models;

namespace InterestCalculationAPI.Controllers
{
    [ApiController]
    [Route("api/payment")]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService _paymentService;

        public PaymentController()
        {
            _paymentService = new PaymentService();
        }

        [HttpPost("calculate")]
       
        public IActionResult Calculate([FromBody] CreditRequest request)
        {
            try
            {
                var cleanedType = request.CreditType
                    .Replace(" ", "")
                    .Replace("İ", "I")
                    .Replace("ı", "i");

                if (!Enum.TryParse<CreditType>(cleanedType, true, out var creditEnum))
                    return BadRequest("Geçersiz kredi türü girdiniz.");

                var result = _paymentService.GeneratePaymentPlan(creditEnum, request.CreditAmount, request.Term, request.InterestRate);
                bool isKonutKredisi = creditEnum == CreditType.KonutKredisi; 
                return Ok(new
                {
                    monthlyPayment = Math.Round(result.MonthlyPayment, 2),
                    totalPayment = Math.Round(result.TotalPayment, 2),
                    totalKKDF = isKonutKredisi ? 0 : Math.Round(result.TotalKKDF, 2),
                    totalBSMV = isKonutKredisi ? 0 : Math.Round(result.TotalBSMV, 2),
                    kkdfRate = isKonutKredisi ? 0 : 15,
                    bsmvRate = isKonutKredisi ? 0 : 15,
                    plans = result.PaymentPlans
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Hesaplama sırasında bir hata oluştu: {ex.Message}");
            }
        }


        [HttpPost("calculate-by-installment")]
        public IActionResult CalculateByInstallment([FromBody] InstallmentRequest request)
        {
            try
            {
                var cleanedType = request.CreditType
                    .Replace(" ", "")
                    .Replace("İ", "I")
                    .Replace("ı", "i");

                if (!Enum.TryParse<CreditType>(cleanedType, true, out var creditEnum))
                    return BadRequest("Geçersiz kredi türü girdiniz.");

                var result = _paymentService.GeneratePaymentPlanByInstallment(
                    creditEnum,
                    request.MonthlyInstallment,
                    request.Term,
                    request.InterestRate
                );

                bool isKonutKredisi = creditEnum == CreditType.KonutKredisi;

                return Ok(new
                {
                    creditAmount = Math.Round(result.CreditAmount, 2),
                    totalPayment = Math.Round(result.TotalPayment, 2),
                    monthlyPayment = Math.Round(result.MonthlyPayment, 2),
                    totalKKDF = isKonutKredisi ? 0 : Math.Round(result.TotalKKDF, 2),
                    totalBSMV = isKonutKredisi ? 0 : Math.Round(result.TotalBSMV, 2),
                    kkdfRate = isKonutKredisi ? 0 : 15,
                    bsmvRate = isKonutKredisi ? 0 : 15,
                    plans = result.PaymentPlans
                });
            }
            catch (Exception ex)
            {
                return BadRequest($"Hesaplama sırasında bir hata oluştu: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetPaymentPlan(int id)
        {
            return Ok(new { Message = $"Payment plan for Credit ID {id} would be returned here." });
        }

        [HttpPost("calculate-deposit")]
        public IActionResult CalculateDeposit([FromBody] DepositInterest req)
        {
            if (req.depositAmount <= 0 || req.expiryTime <= 0 || string.IsNullOrEmpty(req.depositType) || string.IsNullOrEmpty(req.currency))
                return BadRequest("Eksik veya hatalı veri!");

            double rate;
            double stopajOran;
            string symbol;

            switch (req.currency.ToUpper())
            {
                case "USD":
                    rate = 0.15; // %0,15
                    stopajOran = 0.25;
                    symbol = "$";
                    break;
                case "EUR":
                    rate = 0.10; // %0,10
                    stopajOran = 0.25;
                    symbol = "€";
                    break;
                default: // TL
                    rate = req.depositType == "Tanışma Kampanyası" ? 48.5 : 40;
                    stopajOran = 0.15;
                    symbol = "₺";
                    break;
            }

            double brutFaiz = req.depositAmount * (rate / 100) * (req.expiryTime / 365.0);
            double stopaj = brutFaiz * stopajOran;
            double netFaiz = brutFaiz - stopaj;
            double netTutar = req.depositAmount + netFaiz;
            return Ok(new {
                netTutar = Math.Round(netTutar,2),
                gun = req.expiryTime,
                faizOran = rate,
                stopajOran = stopajOran * 100,
                stopaj = Math.Round(stopaj,2),
                brutFaiz = Math.Round(brutFaiz,2),
                netFaiz = Math.Round(netFaiz,2),
                currency = req.currency,
                symbol = symbol
            });
        }

        private double GetDepositRate(string depositType, string currency, int expiryTime)
        {
            // Basit faiz oranları (gerçek uygulamada veritabanından alınır)
            if (currency.ToUpper() == "TRY")
            {
                switch (depositType.ToUpper())
                {
                    case "VADELİ MEVDUAT":
                        if (expiryTime <= 1) return 25.0; // 1 ay
                        if (expiryTime <= 3) return 30.0; // 3 ay
                        if (expiryTime <= 6) return 35.0; // 6 ay
                        if (expiryTime <= 12) return 40.0; // 12 ay
                        return 45.0; // 12+ ay
                    case "VADESİZ MEVDUAT":
                        return 5.0;
                    case "ALTIN MEVDUAT":
                        return 15.0;
                    default:
                        return 25.0;
                }
            }
            else if (currency.ToUpper() == "USD")
            {
                switch (depositType.ToUpper())
                {
                    case "VADELİ MEVDUAT":
                        if (expiryTime <= 1) return 3.5;
                        if (expiryTime <= 3) return 4.0;
                        if (expiryTime <= 6) return 4.5;
                        if (expiryTime <= 12) return 5.0;
                        return 5.5;
                    case "VADESİZ MEVDUAT":
                        return 1.0;
                    default:
                        return 3.5;
                }
            }
            else if (currency.ToUpper() == "EUR")
            {
                switch (depositType.ToUpper())
                {
                    case "VADELİ MEVDUAT":
                        if (expiryTime <= 1) return 2.5;
                        if (expiryTime <= 3) return 3.0;
                        if (expiryTime <= 6) return 3.5;
                        if (expiryTime <= 12) return 4.0;
                        return 4.5;
                    case "VADESİZ MEVDUAT":
                        return 0.5;
                    default:
                        return 2.5;
                }
            }

            return 25.0; // Varsayılan
        }
    }
}
