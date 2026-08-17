// src/services/websocket.ts
import { Platform } from 'react-native';

const getWsUrl = (bookingId: number, token: string) => {
  const host = Platform.OS === 'android' ? '10.0.2.2:8000' : 'localhost:8000';
  return `ws://${host}/api/v1/ws/negotiation?booking_id=${bookingId}&token=${token}`;
};

export class NegotiationWebSocket {
  private ws: WebSocket | null = null;
  private bookingId: number;
  private token: string;
  private onMessageCallback: (data: any) => void;
  private onErrorCallback?: (error: any) => void;
  private onCloseCallback?: () => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    bookingId: number,
    token: string,
    onMessage: (data: any) => void,
    onError?: (error: any) => void,
    onClose?: () => void
  ) {
    this.bookingId = bookingId;
    this.token = token;
    this.onMessageCallback = onMessage;
    this.onErrorCallback = onError;
    this.onCloseCallback = onClose;
  }

  connect() {
    const url = getWsUrl(this.bookingId, this.token);
    console.log(`Connecting to WebSocket: ${url}`);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connection successfully opened');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.onMessageCallback(data);
      } catch (err) {
        console.error('Failed to parse WS JSON message:', err);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      if (this.onErrorCallback) this.onErrorCallback(error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      if (this.onCloseCallback) this.onCloseCallback();
      this.attemptReconnect();
    };
  }

  private reconnectTimeout: any = null;

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`Reconnecting to WS in ${delay}ms (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.reconnectTimeout = setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max WebSocket reconnection attempts reached.');
    }
  }

  send(data: {
    type: 'bid' | 'chat' | 'accept';
    booking_id: number;
    sender_id: string | number;
    role: 'customer' | 'provider';
    amount?: number;
    message?: string;
  }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('Cannot send message: WebSocket connection is closed or connecting');
    }
  }

  close() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      // Clear hook to prevent reconnection attempts on explicit close
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private bookingId?: number;
  private token?: string;
  private onMessageCallback?: (data: any) => void;
  private onErrorCallback?: (error: any) => void;

  connect(
    bookingId: number,
    token: string,
    onMessage: (data: any) => void,
    onError?: (error: any) => void
  ) {
    this.bookingId = bookingId;
    this.token = token;
    this.onMessageCallback = onMessage;
    this.onErrorCallback = onError;

    const url = getWsUrl(bookingId, token);
    console.log(`Connecting to WebSocket: ${url}`);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocketService connection successfully opened');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onMessageCallback) this.onMessageCallback(data);
      } catch (err) {
        console.error('Failed to parse WS JSON message:', err);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocketService Error:', error);
      if (this.onErrorCallback) this.onErrorCallback(error);
    };

    this.ws.onclose = () => {
      console.log('WebSocketService connection closed');
    };
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('Cannot send message: WebSocket connection is closed');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
