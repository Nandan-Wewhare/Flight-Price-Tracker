using System.Collections.Generic;
using System.Threading.Tasks;

public interface ICosmosDbService
{
    Task AddItemAsync<T>(T item) where T : class;
    Task<T> GetItemAsync<T>(string id) where T : class;
    Task<IEnumerable<FlightTrackingRequest>> GetActiveRequestsAsync();
    Task UpdateItemAsync<T>(string id, T item) where T : class;
    Task DeleteItemAsync<T>(string id) where T : class;
}