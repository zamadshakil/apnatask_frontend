import { runtime } from '../config/runtime';
import { typedApi } from './api';

export interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

export class ThreadSubscription {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private closed = false;

  constructor(
    private readonly threadId: string,
    private readonly onEvent: (event: RealtimeEvent) => void,
    private readonly onError?: (error: unknown) => void,
  ) {}

  async connect(): Promise<void> {
    this.closed = false;
    const { data, error } = await typedApi.POST('/api/v2/threads/{thread_id}/realtime-ticket', {
      params: { path: { thread_id: this.threadId } },
    });
    if (error || !data) throw error ?? new Error('Unable to create realtime ticket');

    const websocketPath = data.websocket_path.startsWith('/')
      ? data.websocket_path
      : `/${data.websocket_path}`;
    this.socket = new WebSocket(`${runtime.websocketBaseUrl}${websocketPath}`);
    this.socket.onopen = () => {
      this.reconnectAttempt = 0;
    };
    this.socket.onmessage = (event) => {
      try {
        this.onEvent(JSON.parse(String(event.data)) as RealtimeEvent);
      } catch (error) {
        this.onError?.(error);
      }
    };
    this.socket.onerror = (event) => this.onError?.(event);
    this.socket.onclose = () => {
      this.socket = null;
      if (!this.closed) this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, 30_000);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.onError?.(error);
        if (!this.closed) this.scheduleReconnect();
      });
    }, delay);
  }

  ping(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'ping' }));
    }
  }

  close(): void {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.socket?.close();
    this.socket = null;
  }
}
