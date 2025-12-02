using System;
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using log4net;
using PulseMap.Interfaces;

namespace PulseMap.Service.WS;

public sealed class WebSocketNotificationService : IWebSocketNotificationService
{
    private readonly ConcurrentDictionary<Guid, WebSocket> _sockets = new();
    private readonly ILog _logger = LogManager.GetLogger(typeof(WebSocketNotificationService));

    public async Task HandleClientAsync(WebSocket socket, CancellationToken ct)
    {
        var id = Guid.NewGuid();
        _sockets.TryAdd(id, socket);
        _logger.InfoFormat("WebSocket client connected. ID: {0}, Total clients: {1}", id, _sockets.Count);

        try
        {
            var buffer = new byte[1024 * 4];
            while (!ct.IsCancellationRequested && socket.State == WebSocketState.Open)
            {
                var result = await socket.ReceiveAsync(buffer, ct);
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    _logger.InfoFormat("WebSocket client {0} requested close", id);
                    break;
                }

                // Optional: echo or handle client messages
                if (result.MessageType == WebSocketMessageType.Text)
                {
                    var incoming = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    _logger.DebugFormat("Received message from client {0}: {1}", id, incoming);
                    // Handle incoming client message if needed
                    // For now, ignore or implement command parsing.
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.InfoFormat("WebSocket client {0} operation cancelled", id);
        }
        catch (Exception ex)
        {
            _logger.ErrorFormat("WebSocket client {0} error: {1}", id, ex.Message);
        }
        finally
        {
            _sockets.TryRemove(id, out _);
            _logger.InfoFormat("WebSocket client disconnected. ID: {0}, Remaining clients: {1}", id, _sockets.Count);

            if (socket.State != WebSocketState.Closed && socket.State != WebSocketState.Aborted)
            {
                try
                {
                    await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.WarnFormat("Error closing socket {0}: {1}", id, ex.Message);
                }
            }
            socket.Dispose();
        }
    }

    public Task BroadcastJsonAsync(WebSocketPayload payload, CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
        _logger.InfoFormat("Broadcasting JSON to {0} clients: {1}", _sockets.Count, json);
        return BroadcastTextAsync(json, ct);
    }

    public async Task BroadcastTextAsync(string message, CancellationToken ct = default)
    {
        _logger.InfoFormat("Broadcasting text to {0} clients", _sockets.Count);

        if (_sockets.IsEmpty)
        {
            _logger.Warn("No connected WebSocket clients to broadcast to");
            return;
        }

        var bytes = Encoding.UTF8.GetBytes(message);
        var segment = new ArraySegment<byte>(bytes);

        var disconnectedClients = new List<Guid>();

        foreach (var kvp in _sockets)
        {
            var socket = kvp.Value;
            if (socket.State != WebSocketState.Open)
            {
                _logger.WarnFormat("Client {0} socket state is {1}, skipping", kvp.Key, socket.State);
                disconnectedClients.Add(kvp.Key);
                continue;
            }

            try
            {
                await socket.SendAsync(segment, WebSocketMessageType.Text, true, ct);
                _logger.DebugFormat("Successfully sent message to client {0}", kvp.Key);
            }
            catch (Exception ex)
            {
                _logger.ErrorFormat("Failed to send to client {0}: {1}", kvp.Key, ex.Message);
                disconnectedClients.Add(kvp.Key);
            }
        }

        // Clean up disconnected clients
        foreach (var clientId in disconnectedClients)
        {
            if (_sockets.TryRemove(clientId, out var socket))
            {
                try
                {
                    socket.Abort();
                    socket.Dispose();
                }
                catch (Exception ex)
                {
                    _logger.WarnFormat("Error disposing client {0}: {1}", clientId, ex.Message);
                }
            }
        }

        if (disconnectedClients.Count > 0)
        {
            _logger.InfoFormat("Cleaned up {0} disconnected clients", disconnectedClients.Count);
        }
    }
}
