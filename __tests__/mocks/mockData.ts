export interface Provider {
  provider_id: number;
  name: string;
  latitude: number;
  longitude: number;
  kyc_verified: boolean;
  category: string;
}

export interface Booking {
  id: number;
  customer_id: number;
  amount: number;
  status: 'pending' | 'accepted' | 'completed' | 'canceled';
  customer_phone: string;
  provider_id: number | null;
  transaction_id?: string | null;
  escrow_status?: 'locked' | 'released' | 'refunded' | null;
}

export const mockProviders: Provider[] = [
  { provider_id: 101, name: "Ali Plumber", latitude: 33.6844, longitude: 73.0479, kyc_verified: true, category: "plumber" },
  { provider_id: 102, name: "Zahid Electrician", latitude: 33.6900, longitude: 73.0500, kyc_verified: true, category: "electrician" },
  { provider_id: 103, name: "Kamran Plumber (No KYC)", latitude: 33.6800, longitude: 73.0400, kyc_verified: false, category: "plumber" }
];

export const mockBookings: Booking[] = [
  { id: 1, customer_id: 10, amount: 150.0, status: 'pending', customer_phone: '+923001234567', provider_id: null }
];
