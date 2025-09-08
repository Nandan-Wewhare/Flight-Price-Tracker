using Microsoft.AspNetCore.Mvc;

namespace FlightPriceTracker_API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TrackingController : ControllerBase
    {
        private readonly ICosmosDbService _cosmosDbService;
        public TrackingController(ICosmosDbService cosmosDbService)
        {
            _cosmosDbService = cosmosDbService;
        }

        [HttpGet]
        public async Task<IActionResult> GetActiveTrackings()
        {
            var items = await _cosmosDbService.GetActiveRequestsAsync();
            return Ok(items);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTracking([FromBody] FlightTrackingRequest request)
        {
            request.Id = Guid.NewGuid().ToString();
            request.CreatedAt = DateTime.UtcNow;
            request.NotificationSent = false;
            await _cosmosDbService.AddItemAsync(request);
            return Ok(request);
        }
    }
}
