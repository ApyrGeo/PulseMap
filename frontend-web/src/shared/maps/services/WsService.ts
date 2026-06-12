export enum PayloadEntityType {
  None = 0,
  User = 1,
  Location = 2,
  Message = 3,
  Response = 4,
}

export enum PayloadActionType {
  None = 0,
  Created = 1,
  Updated = 2,
  Deleted = 3,
}

export interface WebSocketPayload {
  entityType: PayloadEntityType;
  actionType: PayloadActionType;
  data: any;
}

type EntityHandler = (data: any) => void;

interface EntityHandlers {
  onCreate?: EntityHandler;
  onUpdate?: EntityHandler;
  onDelete?: EntityHandler;
}

export class LocationWsService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly reconnectDelay = 3000;
  private handlers: Map<PayloadEntityType, EntityHandlers> = new Map();

  constructor(private url: string) {}

  registerEntityHandlers(
    entityType: PayloadEntityType,
    handlers: EntityHandlers
  ) {
    this.handlers.set(entityType, handlers);
  }

  unregisterEntityHandlers(entityType: PayloadEntityType) {
    this.handlers.delete(entityType);
  }

  clearAllHandlers() {
    this.handlers.clear();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
      };

      this.ws.onmessage = (event) => {
        try {
          const payload: WebSocketPayload = JSON.parse(event.data);
          this.handleMessage(payload);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        this.reconnect();
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.reconnect();
    }
  }

  private handleMessage(payload: WebSocketPayload) {
    const entityHandlers = this.handlers.get(payload.entityType);

    if (!entityHandlers) {
      console.warn(
        'No handlers registered for entity type:',
        payload.entityType
      );
      return;
    }

    switch (payload.actionType) {
      case PayloadActionType.Created:
        entityHandlers.onCreate?.(payload.data);
        break;
      case PayloadActionType.Updated:
        entityHandlers.onUpdate?.(payload.data);
        break;
      case PayloadActionType.Deleted:
        entityHandlers.onDelete?.(payload.data.id || payload.data);
        break;
      default:
        console.warn('Unknown action type:', payload.actionType);
    }
  }

  private reconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(payload: WebSocketPayload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn('WebSocket is not connected');
    }
  }
}
