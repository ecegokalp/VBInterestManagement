using Microsoft.AspNetCore.Mvc;
using InterestCalculationAPI.Data;
using InterestCalculationAPI.Models;

namespace InterestCalculationAPI.Controllers
{
    [ApiController]
    [Route("api/payment")]
    public class PaymentController : ControllerBase
    {
        private readonly DataBaseHandler _db;

        public PaymentController()
        {
            _db = new DataBaseHandler();
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

                var result = _db.GeneratePaymentPlan(creditEnum, request.CreditAmount, request.Term, request.InterestRate);
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


        [HttpGet("{id}")]
        public IActionResult GetPaymentPlan(int id)
        {

            return Ok(new { Message = $"Payment plan for Credit ID {id} would be returned here." });
        }

    }
}