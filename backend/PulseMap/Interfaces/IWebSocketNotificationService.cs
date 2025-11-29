using PulseMap.Service.WS;
using System.Net.WebSockets;

namespace PulseMap.Interfaces;

public interface IWebSocketNotificationService
{
    Task HandleClientAsync(WebSocket socket, CancellationToken ct);
    Task BroadcastJsonAsync(WebSocketPayload payload, CancellationToken ct = default);
    Task BroadcastTextAsync(string message, CancellationToken ct = default);
}
