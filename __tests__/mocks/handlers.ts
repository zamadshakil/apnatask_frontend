import { http, HttpResponse } from 'msw';
import { mockBookings, mockProviders, Booking, Provider } from './mockData';

// Track wallet balances for the provider guardrail tests
export const mockWallets: Record<number, number> = {
  101: 500, // Ali Plumber (Sufficient)
  102: 50  // Zahid Electrician (Insufficient: < 100 PKR)
};

export const handlers = [
  // GET / (health check)
  http.get('*/', () => {
    return HttpResponse.json({
      status: 'healthy',
      app: 'ApnaTask',
      environment: 'testing',
      services: { database: 'up', redis: 'up', celery_broker: 'up' }
    });
  }),

  // POST /api/v1/providers
  http.post('*/api/v1/providers', async ({ request }) => {
    const body = (await request.json()) as any;
    const newProvider: Provider = {
      provider_id: body.provider_id || Math.floor(Math.random() * 1000) + 1,
      name: body.name || 'Anonymous Provider',
      kyc_verified: body.kyc_verified ?? false,
      category: body.category || 'general',
      latitude: body.latitude || 33.6844,
      longitude: body.longitude || 73.0479,
    };
    mockProviders.push(newProvider);
    if (newProvider.provider_id && mockWallets[newProvider.provider_id] === undefined) {
      mockWallets[newProvider.provider_id] = 500; // Default wallet balance
    }
    return HttpResponse.json({ provider_id: newProvider.provider_id, name: newProvider.name }, { status: 201 });
  }),

  // POST /api/v1/provider/location
  http.post('*/api/v1/provider/location', async ({ request }) => {
    const body = (await request.json()) as any;
    const { provider_id, latitude, longitude } = body;
    if (provider_id === undefined || latitude === undefined || longitude === undefined) {
      return new HttpResponse(JSON.stringify({ detail: 'Validation Error' }), { status: 422 });
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return new HttpResponse(JSON.stringify({ detail: 'Coordinates out of bounds' }), { status: 422 });
    }
    
    // Update the mock provider's location in our mock database
    const provider = mockProviders.find(p => p.provider_id === Number(provider_id));
    if (provider) {
      provider.latitude = latitude;
      provider.longitude = longitude;
    }
    return HttpResponse.json({ status: 'success' }, { status: 200 });
  }),

  // GET /api/v1/matching
  http.get('*/api/v1/matching', ({ request }) => {
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get('latitude') || '0');
    const lon = parseFloat(url.searchParams.get('longitude') || '0');
    const radius = parseFloat(url.searchParams.get('radius_km') || '0');
    const category = url.searchParams.get('category');

    if (radius <= 0) {
      return new HttpResponse(JSON.stringify({ detail: 'Radius must be greater than zero' }), { status: 422 });
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return new HttpResponse(JSON.stringify({ detail: 'Coordinates out of bounds' }), { status: 422 });
    }

    const matched = mockProviders
      .filter(p => (!category || p.category === category) && p.kyc_verified)
      .map(p => ({
        provider_id: p.provider_id,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        distance_km: 1.2, // Mocked static distance
        kyc_verified: p.kyc_verified,
        category: p.category
      }));

    return HttpResponse.json(matched);
  }),

  // GET /api/v1/bookings
  http.get('*/api/v1/bookings', () => {
    return HttpResponse.json(mockBookings);
  }),

  // GET /api/v1/jobs
  http.get('*/api/v1/jobs', ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const jobs = mockBookings
      .filter((booking) => ['pending', 'bidding'].includes(booking.status))
      .filter((booking) => !category || booking.category === category)
      .map((booking) => ({
        id: booking.id,
        customer_id: booking.customer_id,
        category: booking.category || 'other',
        description: booking.description || 'Service request',
        budget: booking.amount,
        status: booking.status,
      }));
    return HttpResponse.json(jobs);
  }),

  // POST /api/v1/bookings
  http.post('*/api/v1/bookings', async ({ request }) => {
    const body = (await request.json()) as any;
    const { customer_id, amount, category, description, customer_phone } = body;
    if (customer_id === undefined || amount === undefined) {
      return new HttpResponse(JSON.stringify({ detail: 'Validation Error' }), { status: 422 });
    }
    const newId = mockBookings.length + 1;
    const newBooking: Booking = {
      id: newId,
      customer_id: Number(customer_id),
      amount: Number(amount),
      category: category || 'other',
      description: description || 'Service request',
      status: 'pending',
      customer_phone: customer_phone || '+923001234567',
      provider_id: null
    };
    mockBookings.push(newBooking);
    return HttpResponse.json(newBooking, { status: 201 });
  }),

  // POST /api/v1/bookings/:bookingId/accept
  http.post('*/api/v1/bookings/:bookingId/accept', async ({ params, request }) => {
    const bookingId = Number(params.bookingId);
    const body = (await request.json()) as any;
    const { provider_id } = body;
    const booking = mockBookings.find(b => b.id === bookingId);
    if (!booking) {
      return new HttpResponse(JSON.stringify({ detail: 'Booking not found' }), { status: 404 });
    }
    booking.status = 'accepted';
    booking.provider_id = provider_id ? Number(provider_id) : null;
    return HttpResponse.json({
      status: 'success',
      booking_id: bookingId,
      booking_status: 'accepted'
    });
  }),

  // POST /api/v1/bookings/:bookingId/cancel
  http.post('*/api/v1/bookings/:bookingId/cancel', ({ params }) => {
    const bookingId = Number(params.bookingId);
    const booking = mockBookings.find(b => b.id === bookingId);
    if (!booking) {
      return new HttpResponse(JSON.stringify({ detail: 'Booking not found' }), { status: 404 });
    }
    booking.status = 'canceled';
    return HttpResponse.json({
      status: 'success',
      booking_id: bookingId,
      booking_status: 'canceled'
    });
  }),

  // POST /api/v1/bookings/:bookingId/complete
  http.post('*/api/v1/bookings/:bookingId/complete', ({ params }) => {
    const bookingId = Number(params.bookingId);
    const booking = mockBookings.find(b => b.id === bookingId);
    if (!booking) {
      return new HttpResponse(JSON.stringify({ detail: 'Booking not found' }), { status: 404 });
    }
    booking.status = 'completed';
    return HttpResponse.json({
      status: 'success',
      booking_id: bookingId,
      booking_status: 'completed'
    });
  }),

  // Get Wallet Balance
  http.get('*/api/v1/provider/:providerId/wallet', ({ params }) => {
    const providerId = Number(params.providerId);
    const balance = mockWallets[providerId] !== undefined ? mockWallets[providerId] : 0;
    return HttpResponse.json({ provider_id: providerId, balance });
  }),

  // Add Wallet Money
  http.post('*/api/v1/provider/:providerId/wallet/topup', async ({ params, request }) => {
    const providerId = Number(params.providerId);
    const body = (await request.json()) as any;
    const { amount } = body;
    if (amount <= 0) {
      return new HttpResponse(JSON.stringify({ detail: 'Invalid top-up amount' }), { status: 400 });
    }
    if (mockWallets[providerId] === undefined) {
      mockWallets[providerId] = 0;
    }
    mockWallets[providerId] += Number(amount);
    return HttpResponse.json({ provider_id: providerId, balance: mockWallets[providerId] });
  }),

  // POST /api/v1/push-token
  http.post('*/api/v1/push-token', async ({ request }) => {
    const body = (await request.json()) as any;
    const { user_id, role, push_token } = body;
    if (user_id === undefined || role === undefined || push_token === undefined) {
      return new HttpResponse(JSON.stringify({ detail: 'Validation Error' }), { status: 422 });
    }
    return HttpResponse.json({ status: 'success', message: 'Push token registered successfully' }, { status: 200 });
  })
];
