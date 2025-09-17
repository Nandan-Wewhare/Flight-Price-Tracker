using Newtonsoft.Json;

public class FlightTrackingRequest
{
    [JsonProperty("id")]
    public string Id { get; set; }
    public string UserEmail { get; set; }
    public string Origin { get; set; }
    public string Destination { get; set; }
    public DateTime DepartureDate { get; set; }
    public decimal TargetPrice { get; set; }
    public decimal ActualPrice { get; set; }
    public bool NotificationSent { get; set; }
    public DateTime CreatedAt { get; set; }
}