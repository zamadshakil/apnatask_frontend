// __tests__/integration/App.test.tsx — Integration tests for root App mounting and auth session handling
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import App from '../../App';
import { supabase } from '../../src/services/supabaseClient';

describe('Root App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mounts cleanly and renders LoginScreen when unauthenticated', async () => {
    jest.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
      data: { session: null },
      error: null,
    } as any);

    jest.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValueOnce({
      data: {
        subscription: {
          id: 'sub-unauth',
          callback: jest.fn(),
          unsubscribe: jest.fn(),
        },
      },
    } as any);

    const view = render(<App />);

    await waitFor(() => {
      expect(view.getByText('Welcome Back')).toBeTruthy();
      expect(view.getAllByText('Sign In')[0]).toBeTruthy();
    });
  });

  it('handles async session loading for customer role and renders Customer workspace', async () => {
    jest.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'mock-customer-token',
          user: {
            id: 'customer-10',
            user_metadata: { role: 'customer' },
          },
        },
      },
      error: null,
    } as any);

    jest.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValueOnce({
      data: {
        subscription: {
          id: 'sub-customer',
          callback: jest.fn(),
          unsubscribe: jest.fn(),
        },
      },
    } as any);

    const view = render(<App />);

    await waitFor(() => {
      expect(view.getByText('ApnaTask')).toBeTruthy();
      expect(view.getByTestId('tab-home')).toBeTruthy();
    });
  });

  it('handles async session loading for provider role and renders Provider workspace', async () => {
    jest.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
      data: {
        session: {
          access_token: 'mock-provider-token',
          user: {
            id: 'provider-101',
            user_metadata: { role: 'provider' },
          },
        },
      },
      error: null,
    } as any);

    jest.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValueOnce({
      data: {
        subscription: {
          id: 'sub-provider',
          callback: jest.fn(),
          unsubscribe: jest.fn(),
        },
      },
    } as any);

    const view = render(<App />);

    await waitFor(() => {
      expect(view.getByText('ApnaTask Pro')).toBeTruthy();
      expect(view.getByTestId('tab-findJobs')).toBeTruthy();
    });
  });
});
