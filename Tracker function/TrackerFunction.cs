using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using Microsoft.ApplicationInsights;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;

namespace Tracker_function
{
    public class TrackerFunction
    {
        private static readonly HttpClient httpClient = new();
        private static readonly string cosmosEndpoint = "https://cosmosaccount-flight-price-tracker.documents.azure.com:443/";
        private static readonly string databaseId = "FlightPriceTracker";
        private static readonly string containerId = "TrackingData";
        private readonly TelemetryClient _telemetryClient;

        public TrackerFunction(TelemetryClient telemetryClient)
        {
            _telemetryClient = telemetryClient;
        }

        [Function("TrackerFunction")]
        public async Task Run([TimerTrigger("0 */5 * * * *")] TimerInfo myTimer)
        {
            var accessToken = await GetAmadeusToken();
            var cosmosClient = new CosmosClient(cosmosEndpoint, new DefaultAzureCredential());
            var container = cosmosClient.GetContainer(databaseId, containerId);
            var unprocessedItems = await GetAllUnprocessedItems(container);
            _telemetryClient.TrackEvent($"Function triggered at {DateTime.UtcNow.ToString()}", new Dictionary<string, string> { { "UnprocessedItemCount", unprocessedItems.Count.ToString() } });
            foreach (var item in unprocessedItems)
            {
                var currentPrice = await GetFlightPrice(accessToken, item.Origin, item.Destination, item.DepartureDate);
                if (currentPrice <= (decimal)item.TargetPrice * 1.10m && !item.NotificationSent)
                {
                    // Send notification logic here (e.g., email, SMS)
                    _telemetryClient.TrackEvent("Notification sent", new Dictionary<string, string> { { "UserEmail", item.UserEmail }, { "Origin", item.Origin }, { "Destination", item.Destination }, { "CurrentPrice", currentPrice.ToString() } });
                    // Update the item to mark notification as sent
                    item.NotificationSent = true;
                    await container.UpsertItemAsync(item, new PartitionKey(item.id));
                }
            }
        }

        private async Task<string> GetAmadeusToken()
        {
            var secretClient = new SecretClient(new Uri("https://flight-price-tracker-kv.vault.azure.net/"), new DefaultAzureCredential());
            var url = "https://test.api.amadeus.com/v1/security/oauth2/token";
            var clientId = secretClient.GetSecret("amadeus-apikey").Value.Value;
            var clientSecret = secretClient.GetSecret("amadeus-apisecret").Value.Value;
            var requestBody = new Dictionary<string, string>
            {
                { "grant_type", "client_credentials" },
                { "client_id", clientId },
                { "client_secret", clientSecret }
            };
            var requestContent = new FormUrlEncodedContent(requestBody);
            var response = await httpClient.PostAsync(url, requestContent);
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            var tokenResponse = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(responseContent);
            _telemetryClient.TrackEvent("Fetched Amadeus access token" + tokenResponse);
            return tokenResponse["access_token"].ToString();
        }

        private async Task<decimal> GetFlightPrice(string accessToken, string origin, string destination, DateTime departure)
        {
            var url = $"https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode={origin}&destinationLocationCode={destination}&departureDate={departure}&adults=1";
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("Authorization", $"Bearer {accessToken}");
            var response = await httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
            _telemetryClient.TrackEvent("Fetched flight price", new Dictionary<string, string> { { "Origin", origin }, { "Destination", destination }, { "DepartureDate", departure.ToString("yyyy-MM-dd") }});
            var responseContent = await response.Content.ReadAsStringAsync();
            var flightResponse = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(responseContent);
            var data = (System.Text.Json.JsonElement)flightResponse["data"];
            var firstOffer = data[0];
            var priceInfo = firstOffer.GetProperty("price");
            var totalPrice = priceInfo.GetProperty("total").GetDecimal();
            return totalPrice;
        }

        private async Task<List<PriceRecord>> GetAllUnprocessedItems(Container container)
        {
            var query = "SELECT * FROM TrackingData t WHERE t.NotificationSent = false";
            var queryDefinition = new QueryDefinition(query);
            var results = new List<PriceRecord>();

            using var iterator = container.GetItemQueryIterator<PriceRecord>(queryDefinition);

            while (iterator.HasMoreResults)
            {
                foreach (var item in await iterator.ReadNextAsync())
                {
                    results.Add(item);
                }
            }
            _telemetryClient.TrackEvent("Fetched unprocessed items", new Dictionary<string, string> { { "Count", results.Count.ToString() } });
            return results;
        }
    }

    public class PriceRecord
    {
        public string id { get; set; }
        public string UserEmail { get; set; }
        public string Origin { get; set; }
        public string Destination { get; set; }
        public DateTime DepartureDate { get; set; }
        public double TargetPrice { get; set; }
        public bool NotificationSent { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
