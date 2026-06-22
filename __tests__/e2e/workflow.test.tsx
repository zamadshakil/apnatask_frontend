import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CreateTaskScreen from '../../src/screens/customer/CreateTaskScreen';
import FindJobsScreen from '../../src/screens/provider/FindJobsScreen';
import CustomerNegotiationScreen from '../../src/screens/customer/CustomerNegotiationScreen';
import ProviderNegotiationScreen from '../../src/screens/provider/ProviderNegotiationScreen';
import WalletScreen from '../../src/screens/provider/WalletScreen';
import ActiveBookingsScreen from '../../src/screens/customer/ActiveBookingsScreen';
import { mockBookings, mockProviders } from '../mocks/mockData';
import { mockWallets } from '../mocks/handlers';
import { AuthContext } from '../../src/navigation/AuthContext';

// Helper to wrap screen in AuthContext
const withAuth = (screen: React.ReactElement, overrides: Partial<{
  userToken: string;
  userRole: 'customer' | 'provider';
  userId: number;
}> = {}) => {
  const defaultCtx = {
    userToken: overrides.userToken || 'mock-jwt-token',
    userRole: overrides.userRole || 'customer' as const,
    userId: overrides.userId || 10,
    login: jest.fn(),
    logout: jest.fn(),
  };
  return (
    <AuthContext.Provider value={defaultCtx}>
      {screen}
    </AuthContext.Provider>
  );
};

describe('Real-World Scenario E2E Workflows', () => {
  beforeEach(() => {
    // Reset mock databases
    mockBookings.length = 0;
    mockBookings.push({
      id: 1,
      customer_id: 10,
      amount: 150.0,
      status: 'pending',
      customer_phone: '+923001234567',
      provider_id: null,
    });

    mockProviders.length = 0;
    mockProviders.push(
      { provider_id: 101, name: 'Ali Plumber', latitude: 33.6844, longitude: 73.0479, kyc_verified: true, category: 'plumber' },
      { provider_id: 102, name: 'Zahid Electrician', latitude: 33.6900, longitude: 73.0500, kyc_verified: true, category: 'electrician' },
      { provider_id: 103, name: 'Kamran Plumber (No KYC)', latitude: 33.6800, longitude: 73.0400, kyc_verified: false, category: 'plumber' },
    );

    mockWallets[101] = 500;
    mockWallets[102] = 50; // Insufficient
  });

  describe('Scenario 1: Customer Posts Task & Views Bookings', () => {
    it('renders CreateTaskScreen and posts a booking via API', async () => {
      const view = render(withAuth(<CreateTaskScreen />, { userRole: 'customer', userId: 10 }));

      // Select a category
      const plumbingChip = view.getByText('Plumbing');
      fireEvent.press(plumbingChip);

      // Fill in description
      const descInput = view.getByPlaceholderText(/Fix leaking pipe/i);
      fireEvent.changeText(descInput, 'Fix leaking tap');

      // Fill in budget
      const budgetInput = view.getByPlaceholderText(/2500/i);
      fireEvent.changeText(budgetInput, '500');

      // Submit the task
      const submitBtn = view.getByText(/Post Task/i);
      fireEvent.press(submitBtn);

      // Verify booking was created
      await waitFor(() => {
        expect(mockBookings.length).toBe(2);
        expect(mockBookings[1].amount).toBe(500);
        expect(mockBookings[1].status).toBe('pending');
      });
    });

    it('renders ActiveBookingsScreen with booking cards', async () => {
      const view = render(withAuth(<ActiveBookingsScreen />, { userRole: 'customer', userId: 10 }));

      // Should show the section header
      expect(view.getByText('Active Bookings')).toBeTruthy();
    });
  });

  describe('Scenario 2: Provider Discovers Jobs', () => {
    it('renders FindJobsScreen and shows nearby jobs', async () => {
      const view = render(withAuth(<FindJobsScreen />, { userRole: 'provider', userId: 101 }));

      // Should show loading first, then jobs
      await waitFor(() => {
        expect(view.getByText('Nearby Jobs')).toBeTruthy();
      });
    });
  });

  describe('Scenario 3: Provider Wallet & Bidding Guardrail', () => {
    it('renders WalletScreen and allows top-up', async () => {
      const view = render(withAuth(<WalletScreen />, { userRole: 'provider', userId: 102 }));

      // Should show wallet balance
      await waitFor(() => {
        expect(view.getByText(/AVAILABLE BALANCE/i)).toBeTruthy();
      });

      // Should show quick top-up chips
      expect(view.getByText('Rs. 100')).toBeTruthy();
      expect(view.getByText('Rs. 250')).toBeTruthy();
      expect(view.getByText('Rs. 500')).toBeTruthy();
      expect(view.getByText('Rs. 1000')).toBeTruthy();
    });

    it('prevents bidding with insufficient wallet balance on ProviderNegotiationScreen', async () => {
      const view = render(withAuth(<ProviderNegotiationScreen />, {
        userRole: 'provider',
        userId: 102,
        userToken: 'mock-jwt-provider-102',
      }));

      // Wait for screen to load
      await waitFor(() => {
        expect(view.getByTestId('input-bid-amount')).toBeTruthy();
      });

      // Enter a bid amount
      const bidInput = view.getByTestId('input-bid-amount');
      fireEvent.changeText(bidInput, '450');

      // Submit bid
      const submitBtn = view.getByTestId('button-submit-bid');
      fireEvent.press(submitBtn);

      // Wallet balance is 50 (< 100), so should show error
      await waitFor(() => {
        const errorBanner = view.queryByText(/Insufficient balance/i);
        expect(errorBanner).toBeTruthy();
      });
    });
  });

  describe('Scenario 4: WebSocket Negotiation', () => {
    it('establishes Customer negotiation screen with WS connection', async () => {
      const view = render(withAuth(<CustomerNegotiationScreen />, {
        userRole: 'customer',
        userId: 10,
        userToken: 'mock-jwt-customer-10',
      }));

      // Should show booking header
      await waitFor(() => {
        expect(view.getByText(/Booking #101/i)).toBeTruthy();
      });

      // Should show connection status
      await waitFor(() => {
        expect(view.getByText(/Connected/i)).toBeTruthy();
      });
    });

    it('establishes Provider negotiation screen with WS connection', async () => {
      const view = render(withAuth(<ProviderNegotiationScreen />, {
        userRole: 'provider',
        userId: 102,
        userToken: 'mock-jwt-provider-102',
      }));

      // Should show booking header
      await waitFor(() => {
        expect(view.getByText(/Job #1/i)).toBeTruthy();
      });
    });

    it('sends a bid from provider and validates input fields', async () => {
      const view = render(withAuth(<ProviderNegotiationScreen />, {
        userRole: 'provider',
        userId: 101,
        userToken: 'mock-jwt-provider-101',
      }));

      // Wait for render
      await waitFor(() => {
        expect(view.getByTestId('input-bid-amount')).toBeTruthy();
      });

      // Enter bid amount
      const bidInput = view.getByTestId('input-bid-amount');
      fireEvent.changeText(bidInput, '450');

      // Submit bid (wallet = 500, so should succeed)
      const submitBtn = view.getByTestId('button-submit-bid');
      fireEvent.press(submitBtn);

      // Should not show error since wallet >= 100
      await waitFor(() => {
        const errorBanner = view.queryByText(/Insufficient balance/i);
        expect(errorBanner).toBeNull();
      });
    });

    it('sends a chat message from provider', async () => {
      const view = render(withAuth(<ProviderNegotiationScreen />, {
        userRole: 'provider',
        userId: 101,
        userToken: 'mock-jwt-provider-101',
      }));

      await waitFor(() => {
        expect(view.getByTestId('chat-message-input')).toBeTruthy();
      });

      const chatInput = view.getByTestId('chat-message-input');
      fireEvent.changeText(chatInput, 'I can start right away');

      const sendBtn = view.getByTestId('button-send-chat');
      fireEvent.press(sendBtn);

      // Message should appear in the chat
      await waitFor(() => {
        expect(view.getAllByText('I can start right away').length).toBeGreaterThan(0);
      });
    });
  });
});
