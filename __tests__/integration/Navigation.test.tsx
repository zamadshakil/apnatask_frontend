// __tests__/integration/Navigation.test.tsx — Integration tests for navigation branching and tab switching
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from '../../src/navigation/AppNavigator';
import CustomerTab from '../../src/navigation/CustomerTab';
import ProviderTab from '../../src/navigation/ProviderTab';
import { AuthContext } from '../../src/navigation/AuthContext';

const withAuthContainer = (
  component: React.ReactElement,
  authValues: {
    userToken: string | null;
    userRole: 'customer' | 'provider' | null;
    userId: string | number | null;
  }
) => {
  return (
    <AuthContext.Provider
      value={{
        userToken: authValues.userToken,
        userRole: authValues.userRole,
        userId: authValues.userId ? String(authValues.userId) : null,
        login: jest.fn(),
        logout: jest.fn(),
      }}
    >
      <NavigationContainer>{component}</NavigationContainer>
    </AuthContext.Provider>
  );
};

describe('Navigation Infrastructure & Branching Integration Tests', () => {
  describe('Root Navigation Branching', () => {
    it('renders LoginScreen when userToken is null (Auth branch)', async () => {
      const view = render(
        withAuthContainer(<AppNavigator />, {
          userToken: null,
          userRole: null,
          userId: null,
        })
      );

      await waitFor(() => {
        expect(view.getByText('Welcome Back')).toBeTruthy();
      });
    });

    it('renders Customer Workspace when userRole is customer', async () => {
      const view = render(
        withAuthContainer(<AppNavigator />, {
          userToken: 'customer-token-123',
          userRole: 'customer',
          userId: 'customer-10',
        })
      );

      await waitFor(() => {
        expect(view.getByText('ApnaTask')).toBeTruthy();
        expect(view.getByTestId('tab-home')).toBeTruthy();
        expect(view.getByTestId('tab-create')).toBeTruthy();
        expect(view.getByTestId('tab-bookings')).toBeTruthy();
      });
    });

    it('renders Provider Workspace when userRole is provider', async () => {
      const view = render(
        withAuthContainer(<AppNavigator />, {
          userToken: 'provider-token-456',
          userRole: 'provider',
          userId: 'provider-101',
        })
      );

      await waitFor(() => {
        expect(view.getByText('ApnaTask Pro')).toBeTruthy();
        expect(view.getByTestId('tab-home')).toBeTruthy();
        expect(view.getByTestId('tab-findJobs')).toBeTruthy();
        expect(view.getByTestId('tab-wallet')).toBeTruthy();
      });
    });
  });

  describe('Customer Tab Switching Navigation', () => {
    it('switches between CustomerHome, CreateTask, and ActiveBookings tabs', async () => {
      const view = render(
        withAuthContainer(<CustomerTab />, {
          userToken: 'customer-token-123',
          userRole: 'customer',
          userId: 'customer-10',
        })
      );

      // Default tab: CustomerHome
      expect(view.getByText('What service do you need?')).toBeTruthy();

      // Switch to CreateTask tab
      fireEvent.press(view.getByTestId('tab-create'));
      await waitFor(() => {
        expect(view.getByText('Post a New Task')).toBeTruthy();
      });

      // Switch to ActiveBookings tab
      fireEvent.press(view.getByTestId('tab-bookings'));
      await waitFor(() => {
        expect(view.getByText('Active Bookings')).toBeTruthy();
      });

      // Switch back to CustomerHome tab
      fireEvent.press(view.getByTestId('tab-home'));
      await waitFor(() => {
        expect(view.getByText('What service do you need?')).toBeTruthy();
      });
    });
  });

  describe('Provider Tab Switching Navigation', () => {
    it('switches between ProviderHome, FindJobs, and ProviderWallet tabs', async () => {
      const view = render(
        withAuthContainer(<ProviderTab />, {
          userToken: 'provider-token-456',
          userRole: 'provider',
          userId: 'provider-101',
        })
      );

      // Default tab: ProviderHome
      expect(view.getByText('CURRENT BALANCE')).toBeTruthy();

      // Switch to FindJobs tab
      fireEvent.press(view.getByTestId('tab-findJobs'));
      await waitFor(() => {
        expect(view.getByText('Nearby Jobs')).toBeTruthy();
      });

      // Switch to ProviderWallet tab
      fireEvent.press(view.getByTestId('tab-wallet'));
      await waitFor(() => {
        expect(view.getByText('AVAILABLE BALANCE')).toBeTruthy();
      });

      // Switch back to ProviderHome tab
      fireEvent.press(view.getByTestId('tab-home'));
      await waitFor(() => {
        expect(view.getByText('CURRENT BALANCE')).toBeTruthy();
      });
    });
  });
});
