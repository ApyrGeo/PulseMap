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
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly reconnectDelay = 3000;
  private handlers: Map<PayloadEntityType, EntityHandlers> = new Map();
  private isDestroyed = false;

  constructor(private url: string) {}

  registerEntityHandlers(entityType: PayloadEntityType, handlers: EntityHandlers) {
    this.handlers.set(entityType, handlers);
  }

  unregisterEntityHandlers(entityType: PayloadEntityType) {
    this.handlers.delete(entityType);
  }

  clearAllHandlers() {
    this.handlers.clear();
  }

  connect() {
    if (this.isDestroyed) return;
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {};

      this.ws.onmessage = (event) => {
        try {
          const payload: WebSocketPayload = JSON.parse(event.data);
          this.handleMessage(payload);
        } catch {
          console.error('Failed to parse WebSocket message');
        }
      };

      this.ws.onerror = () => {
        console.error('WebSocket error');
      };

      this.ws.onclose = () => {
        if (!this.isDestroyed) this.reconnect();
      };
    } catch {
      this.reconnect();
    }
  }

  private handleMessage(payload: WebSocketPayload) {
    const entityHandlers = this.handlers.get(payload.entityType);
    if (!entityHandlers) return;

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
    }
  }

  private reconnect() {
    if (this.isDestroyed) return;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => this.connect(), this.reconnectDelay);
  }

  disconnect() {
    this.isDestroyed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
