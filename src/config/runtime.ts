import Constants from 'expo-constants';
import { Platform } from 'react-native';

type AppVariant = 'development' | 'alpha' | 'staging' | 'production';
type AuthMode = 'phone' | 'email';

const appVariant =
  (Constants.expoConfig?.extra?.appVariant as AppVariant | undefined) ??
  ((process.env.APP_VARIANT as AppVariant | undefined) || 'development');

const isProduction = appVariant === 'production';
const isHosted = appVariant !== 'development';
const localAuthToken = process.env.EXPO_PUBLIC_LOCAL_AUTH_TOKEN?.trim() || undefined;
const authMode = (process.env.EXPO_PUBLIC_AUTH_MODE?.trim() || 'phone') as AuthMode;

if (isHosted && localAuthToken) {
  throw new Error('EXPO_PUBLIC_LOCAL_AUTH_TOKEN is forbidden in hosted builds');
}
if (!['phone', 'email'].includes(authMode)) {
  throw new Error(`Unsupported EXPO_PUBLIC_AUTH_MODE: ${authMode}`);
}
if (appVariant === 'alpha' && authMode !== 'email') {
  throw new Error('The zero-cost alpha must use email-link authentication');
}
if (isProduction && authMode !== 'phone') {
  throw new Error('Production must use phone authentication');
}

function requiredPublicValue(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (isHosted) throw new Error(`${name} is required in hosted builds`);
  return fallback;
}

function androidEmulatorHost(url: string): string {
  if (Platform.OS !== 'android' || isHosted) return url;
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
const configuredMapStyleUrl = process.env.EXPO_PUBLIC_MAP_STYLE_URL?.trim();
const mapboxAccessToken = (
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_TOKEN
)?.trim();

if (appVariant === 'alpha' && mapboxAccessToken) {
  throw new Error('Mapbox tokens are forbidden in the zero-cost alpha');
}

if (isProduction && !mapboxAccessToken && !configuredMapStyleUrl) {
  throw new Error('EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN or EXPO_PUBLIC_MAP_STYLE_URL is required in production');
}

if (isHosted && (!apiBaseUrl.startsWith('https://') || !websocketBaseUrl.startsWith('wss://'))) {
  throw new Error('Hosted API and realtime endpoints must use HTTPS/WSS');
}

export const runtime = Object.freeze({
  appVariant,
  isProduction,
  isHosted,
  authMode,
  apiBaseUrl,
  websocketBaseUrl,
  supabaseUrl: requiredPublicValue('EXPO_PUBLIC_SUPABASE_URL', 'http://localhost:54321'),
  supabaseAnonKey: requiredPublicValue('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'development-anon-key'),
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() || undefined,
  mapProvider: mapboxAccessToken ? 'mapbox' : 'openfreemap',
  // Mapbox's Static Tiles API is intentionally consumed through the existing
  // MapLibre renderer so one map interaction model works on web, iOS, and
  // Android. The public token must be URL/domain restricted in Mapbox.
  mapStyleUrl: configuredMapStyleUrl || (mapboxAccessToken ? {
    version: 8 as const,
    sources: {
      mapbox: {
        type: 'raster' as const,
        tiles: [`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/512/{z}/{x}/{y}?access_token=${encodeURIComponent(mapboxAccessToken)}`],
        tileSize: 512,
        attribution: '© Mapbox © OpenStreetMap',
      },
    },
    layers: [{ id: 'mapbox-streets', type: 'raster' as const, source: 'mapbox' }],
  } : 'https://tiles.openfreemap.org/styles/liberty'),
  localAuthToken,
});
