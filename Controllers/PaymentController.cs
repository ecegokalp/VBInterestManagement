using Microsoft.AspNetCore.Mvc;
using InterestCalculationAPI.Data;
using InterestCalculationAPI.Models;

namespace InterestCalculationAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
            var plan = _db.GeneratePaymentPlan(request.CreditType, request.CreditAmount, request.Term, request.InterestRate);
            return Ok(plan);
        }
        [HttpGet("{id}")]
        public IActionResult GetPaymentPlan(int id)
        {

            return Ok(new { Message = $"Payment plan for Credit ID {id} would be returned here." });
        }

    }
}