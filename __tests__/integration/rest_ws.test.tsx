import api from '../../src/services/api';
import { mockBookings, mockProviders } from '../mocks/mockData';
import { mockWallets } from '../mocks/handlers';

describe('REST API & WebSocket Interceptors Integration Tests', () => {
  beforeEach(() => {
    // Reset databases/states
    mockBookings.length = 0;
    mockBookings.push({ id: 1, customer_id: 10, amount: 150.0, status: 'pending', customer_phone: '+923001234567', provider_id: null });
    
    mockProviders.length = 0;
    mockProviders.push(
      { provider_id: 101, name: "Ali Plumber", latitude: 33.6844, longitude: 73.0479, kyc_verified: true, category: "plumber" },
      { provider_id: 102, name: "Zahid Electrician", latitude: 33.6900, longitude: 73.0500, kyc_verified: true, category: "electrician" },
      { provider_id: 103, name: "Kamran Plumber (No KYC)", latitude: 33.6800, longitude: 73.0400, kyc_verified: false, category: "plumber" }
    );

    mockWallets[101] = 500;
    mockWallets[102] = 50;
  });

  it('verifies GET / healthcheck', async () => {
    const res = await api.get('/');
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('healthy');
  });

  it('verifies POST /api/v1/providers', async () => {
    const res = await api.post('/providers', {
      name: 'Test Prov',
      kyc_verified: true,
      category: 'plumber',
    });
    expect(res.status).toBe(201);
    expect(res.data.provider_id).toBeDefined();
    expect(res.data.name).toBe('Test Prov');
  });

  it('verifies POST /api/v1/provider/location', async () => {
    const res = await api.post('/provider/location', {
      provider_id: 101,
      latitude: 33.6000,
      longitude: 73.0100,
    });
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('success');
  });

  it('verifies GET /api/v1/matching', async () => {
    const res = await api.get('/matching?latitude=33.6844&longitude=73.0479&radius_km=5.0&category=plumber');
    expect(res.status).toBe(200);
    expect(res.data.length).toBe(1);
    expect(res.data[0].provider_id).toBe(101); // Ali Plumber is category plumber and kyc_verified: true
  });

  it('verifies POST /api/v1/bookings', async () => {
    const res = await api.post('/bookings', {
      customer_id: 10,
      amount: 450,
      customer_phone: '+923001112222',
    });
    expect(res.status).toBe(201);
    expect(res.data.id).toBeDefined();
    expect(res.data.status).toBe('pending');
  });

  it('verifies POST /api/v1/bookings/:bookingId/accept', async () => {
    const res = await api.post('/bookings/1/accept', {
      provider_id: 101,
    });
    expect(res.status).toBe(200);
    expect(res.data.booking_status).toBe('accepted');
    expect(mockBookings[0].status).toBe('accepted');
    expect(mockBookings[0].provider_id).toBe(101);
  });

  it('verifies POST /api/v1/bookings/:bookingId/cancel', async () => {
    const res = await api.post('/bookings/1/cancel');
    expect(res.status).toBe(200);
    expect(res.data.booking_status).toBe('canceled');
    expect(mockBookings[0].status).toBe('canceled');
  });

  it('verifies POST /api/v1/bookings/:bookingId/complete', async () => {
    const res = await api.post('/bookings/1/complete');
    expect(res.status).toBe(200);
    expect(res.data.booking_status).toBe('completed');
    expect(mockBookings[0].status).toBe('completed');
  });

  it('verifies stateful WebSocket connection and broadcast messaging', (done) => {
    const customerSocket = new global.WebSocket('ws://localhost:8000/api/v1/ws/negotiation?booking_id=1&token=mock-jwt-customer-10');
    const providerSocket = new global.WebSocket('ws://localhost:8000/api/v1/ws/negotiation?booking_id=1&token=mock-jwt-provider-20');

    let customerReceivedMsg = false;
    let providerReceivedMsg = false;

    customerSocket.onmessage = (event: any) => {
      console.log('Customer WS received message:', event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'bid' && data.amount === 450) {
          customerReceivedMsg = true;
          
          // Customer accepts the bid (async to allow other listeners to process)
          setTimeout(() => {
            console.log('Customer WS sending accept...');
            customerSocket.send(JSON.stringify({
              type: 'accept',
              booking_id: 1,
              sender_id: 10,
              role: 'customer',
            }));
          }, 0);
        } else if (data.type === 'accept' && data.escrow_status === 'locked') {
          console.log('Customer WS received accept, verifying assertions...');
          expect(data.transaction_id).toBeDefined();
          expect(customerReceivedMsg).toBe(true);
          expect(providerReceivedMsg).toBe(true);
          
          console.log('Assertions passed, closing sockets and calling done()');
          customerSocket.close();
          providerSocket.close();
          done();
        }
      } catch (err) {
        console.error('Error in customerSocket.onmessage:', err);
        done(err);
      }
    };

    providerSocket.onmessage = (event: any) => {
      console.log('Provider WS received message:', event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'bid' && data.amount === 450) {
          providerReceivedMsg = true;
        }
      } catch (err) {
        console.error('Error in providerSocket.onmessage:', err);
      }
    };

    let openCount = 0;
    const checkOpen = () => {
      openCount++;
      console.log(`Socket opened. Count: ${openCount}`);
      if (openCount === 2) {
        console.log('Both sockets open, sending provider bid...');
        providerSocket.send(JSON.stringify({
          type: 'bid',
          booking_id: 1,
          sender_id: 101,
          role: 'provider',
          amount: 450,
        }));
      }
    };

    customerSocket.onopen = checkOpen;
    providerSocket.onopen = checkOpen;
  });
});
