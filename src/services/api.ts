import * as Crypto from 'expo-crypto';
import createClient from 'openapi-fetch';
import type { paths } from '../api/schema';
import { runtime } from '../config/runtime';
import { supabase } from './supabaseClient';

export const createIdempotencyKey = () => Crypto.randomUUID();

async function accessToken(): Promise<string | undefined> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.access_token;
}

export const typedApi = createClient<paths>({ baseUrl: runtime.apiBaseUrl });

typedApi.use({
  async onRequest({ request }) {
    const token = await accessToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    request.headers.set('X-Request-ID', Crypto.randomUUID());
    return request;
  },
});
