namespace PulseMap.Service.WS;

public enum PayloadEntityType
{
    None = 0,
    User = 1,
    Location = 2,
    Message = 3,
    Response = 4
}

public enum PayloadActionType
{
    None = 0,
    Created = 1,
    Updated = 2,
    Deleted = 3,
}

public record WebSocketPayload
{
    public required PayloadEntityType EntityType { get; init; }
    public required PayloadActionType ActionType { get; init; }
    public required object Data { get; init; }
}
