import Constants from 'expo-constants';
import { Platform } from 'react-native';

type AppVariant = 'development' | 'staging' | 'production';

const appVariant =
  (Constants.expoConfig?.extra?.appVariant as AppVariant | undefined) ??
  ((process.env.APP_VARIANT as AppVariant | undefined) || 'development');

const isProduction = appVariant === 'production';
const localAuthToken = process.env.EXPO_PUBLIC_LOCAL_AUTH_TOKEN?.trim() || undefined;

if (isProduction && localAuthToken) {
  throw new Error('EXPO_PUBLIC_LOCAL_AUTH_TOKEN is forbidden in production');
}

function requiredPublicValue(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (isProduction) throw new Error(`${name} is required in production`);
  return fallback;
}

function androidEmulatorHost(url: string): string {
  if (Platform.OS !== 'android' || isProduction) return url;
  return url.replace('://localhost', '://10.0.2.2').replace('://127.0.0.1', '://10.0.2.2');
}

const configuredApiBaseUrl = androidEmulatorHost(
  requiredPublicValue('EXPO_PUBLIC_API_BASE_URL', 'http://localhost:8000/api/v2'),
).replace(/\/$/, '');
// Generated OpenAPI operations already contain the `/api/v2` prefix. Accept
// older environment files that included it without producing a doubled path.
const apiBaseUrl = configuredApiBaseUrl.replace(/\/api\/v2$/, '');
const websocketBaseUrl = androidEmulatorHost(
  requiredPublicValue('EXPO_PUBLIC_WS_BASE_URL', 'ws://localhost:8000'),
).replace(/\/$/, '');

if (isProduction && (!apiBaseUrl.startsWith('https://') || !websocketBaseUrl.startsWith('wss://'))) {
  throw new Error('Production API and realtime endpoints must use HTTPS/WSS');
}

export const runtime = Object.freeze({
  appVariant,
  isProduction,
  apiBaseUrl,
  websocketBaseUrl,
  supabaseUrl: requiredPublicValue('EXPO_PUBLIC_SUPABASE_URL', 'http://localhost:54321'),
  supabaseAnonKey: requiredPublicValue('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'development-anon-key'),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() || undefined,
  localAuthToken,
});
