import * as Crypto from 'expo-crypto';
import createClient from 'openapi-fetch';
import type { paths } from '../api/schema';
import { runtime } from '../config/runtime';
import { supabase } from './supabaseClient';

export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  request_id?: string;
}

export class ApiProblem extends Error {
  constructor(public readonly problem: ProblemDetails) {
    super(problem.detail || problem.title);
    this.name = 'ApiProblem';
  }
}

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
  async onResponse({ response }) {
    if (!response.ok && response.headers.get('content-type')?.includes('application/problem+json')) {
      throw new ApiProblem((await response.clone().json()) as ProblemDetails);
    }
    return response;
  },
});
