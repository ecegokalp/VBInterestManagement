using Microsoft.AspNetCore.Mvc;
using InterestCalculationAPI.Services;
using InterestCalculationAPI.Models;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using InterestCalculationAPI.Data;

namespace InterestCalculationAPI.Controllers
{
    [ApiController]
    [Route("api/payment")]
    public class PaymentController : ControllerBase
    {
        private readonly DataBaseHandler _dbHandler;

        public PaymentController(DataBaseHandler dbHandler)
        {
            _dbHandler = dbHandler;
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

                var paymentService = new PaymentService();
                var result = paymentService.GeneratePaymentPlan(creditEnum, request.CreditAmount, request.Term, request.InterestRate);
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

                var paymentService = new PaymentService();
                var result = paymentService.GeneratePaymentPlanByInstallment(
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

            // veritabanından oranı çek
            var rate = _dbHandler.GetInterestRate(req.depositAmount, req.expiryTime, req.currency, req.depositType);

            if (!rate.HasValue)
                return BadRequest("Uygun faiz oranı bulunamadı.");

            double stopajOran = 0.15; 
            string symbol = req.currency.ToUpper() == "USD" ? "$" :
                            req.currency.ToUpper() == "EUR" ? "€" : "₺";

            double brutFaiz = req.depositAmount * (rate.Value / 100) * (req.expiryTime / 365.0);
            double stopaj = brutFaiz * stopajOran;
            double netFaiz = brutFaiz - stopaj;
            double netTutar = req.depositAmount + netFaiz;

            return Ok(new
            {
                netTutar = Math.Round(netTutar, 2),
                gun = req.expiryTime,
                faizOran = rate.Value,
                stopajOran = stopajOran * 100,
                stopaj = Math.Round(stopaj, 2),
                brutFaiz = Math.Round(brutFaiz, 2),
                netFaiz = Math.Round(netFaiz, 2),
                currency = req.currency,
                symbol = symbol
            });
        }

        [HttpGet("get-deposit-rate")]
        public IActionResult GetDepositRate(double amount, int term, string currency = "TL", string productType = "standart")
        {
            var rate = _dbHandler.GetInterestRate(amount, term, currency, productType);
            if (rate.HasValue)
                return Ok(rate.Value);
            else
                return NotFound("Uygun faiz oranı bulunamadı.");
        }
    }
}
