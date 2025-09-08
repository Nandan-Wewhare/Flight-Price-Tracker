using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Cosmos.Linq;

public class CosmosDbService : ICosmosDbService
{
    private readonly Container _container;

    public CosmosDbService(
        CosmosClient cosmosClient,
        string databaseName,
        string containerName)
    {
        _container = cosmosClient.GetContainer(databaseName, containerName);
    }

    public async Task AddItemAsync<T>(T item) where T : class
    {
        await _container.CreateItemAsync(item);
    }

    public async Task<T> GetItemAsync<T>(string id) where T : class
    {
        try
        {
            var response = await _container.ReadItemAsync<T>(id, new PartitionKey(id));
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<IEnumerable<FlightTrackingRequest>> GetActiveRequestsAsync()
    {
        var query = _container.GetItemLinqQueryable<FlightTrackingRequest>(allowSynchronousQueryExecution: true);
        var iterator = query.ToFeedIterator();
        var results = new List<FlightTrackingRequest>();
        while (iterator.HasMoreResults)
        {
            foreach (var item in await iterator.ReadNextAsync())
            {
                results.Add(item);
            }
        }
        return results;
    }

    public async Task UpdateItemAsync<T>(string id, T item) where T : class
    {
        await _container.UpsertItemAsync(item, new PartitionKey(id));
    }

    public async Task DeleteItemAsync<T>(string id) where T : class
    {
        await _container.DeleteItemAsync<T>(id, new PartitionKey(id));
    }
}