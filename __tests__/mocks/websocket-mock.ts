import { EventEmitter } from 'events';

// In-memory pub/sub broker to connect multiple client sockets
class MockSocketBroker extends EventEmitter {
  publish(bookingId: number, message: string, sender: MockWebSocket) {
    this.emit(`channel_${bookingId}`, message, sender);
  }
}

const broker = new MockSocketBroker();

export class MockWebSocket extends EventEmitter {
  url: string;
  readyState: number = 0; // CONNECTING
  bookingId: number = 0;
  token: string = '';
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  CONNECTING = 0;
  OPEN = 1;
  CLOSING = 2;
  CLOSED = 3;

  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((err: any) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  private connectTimeout: any = null;

  constructor(url: string) {
    super();
    this.url = url;
    this.parseQueryParams(url);
    
    // Simulate connection lag
    this.connectTimeout = setTimeout(() => {
      this.establishConnection();
    }, 5);
  }

  private parseQueryParams(url: string) {
    try {
      const queryString = url.split('?')[1];
      if (queryString) {
        const params = new URLSearchParams(queryString);
        this.bookingId = Number(params.get('booking_id') || 0);
        this.token = params.get('token') || '';
      }
    } catch (e) {
      this.bookingId = 0;
    }
  }

  private establishConnection() {
    if (!this.bookingId) {
      this.readyState = MockWebSocket.CLOSED;
      const err = new Error('Connection rejected: missing booking_id query param');
      this.emit('error', err);
      if (this.onerror) this.onerror(err);
      this.emit('close');
      if (this.onclose) this.onclose();
      return;
    }

    // Subscribe to pub/sub updates for this specific booking
    broker.on(`channel_${this.bookingId}`, this.handlePubSubMessage);

    // Connect successful
    this.readyState = MockWebSocket.OPEN;
    this.emit('open');
    if (this.onopen) this.onopen();
  }

  private handlePubSubMessage = (messageStr: string, sender: MockWebSocket) => {
    // Mimic Pub/Sub: broadcast to all sockets in the channel
    this.emit('message', { data: messageStr });
    if (this.onmessage) this.onmessage({ data: messageStr });
  };

  send(dataStr: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not in OPEN state');
    }

    try {
      const data = JSON.parse(dataStr);
      
      // Validate required fields: type, booking_id, sender_id, role
      if (data.type === undefined || data.booking_id === undefined || data.sender_id === undefined || data.role === undefined) {
        const errorMsg = JSON.stringify({ error: 'Missing message fields (type, booking_id, sender_id, role required)' });
        this.emit('message', { data: errorMsg });
        if (this.onmessage) this.onmessage({ data: errorMsg });
        return;
      }

      // Check if message booking_id matches connected booking_id
      if (Number(data.booking_id) !== this.bookingId) {
        const errorMsg = JSON.stringify({ error: 'Mismatch booking_id' });
        this.emit('message', { data: errorMsg });
        if (this.onmessage) this.onmessage({ data: errorMsg });
        return;
      }

      // If message type is "accept", generate random transaction ID and set escrow_status to "locked"
      if (data.type === 'accept') {
        data.transaction_id = 'TXN-MOCK-' + Math.floor(Math.random() * 1000000);
        data.escrow_status = 'locked';
      }

      const processedMessage = JSON.stringify(data);
      
      // Publish to the broker so other sockets receive it
      broker.publish(this.bookingId, processedMessage, this);
    } catch (err) {
      const errorMsg = JSON.stringify({ error: 'Malformed JSON' });
      this.emit('message', { data: errorMsg });
      if (this.onmessage) this.onmessage({ data: errorMsg });
    }
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
      this.connectTimeout = null;
    }
    broker.off(`channel_${this.bookingId}`, this.handlePubSubMessage);
    this.emit('close');
    if (this.onclose) this.onclose();
  }
}
