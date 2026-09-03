const hostedVariants = new Set(['alpha', 'staging', 'production']);
const variant = process.env.APP_VARIANT ?? 'development';

if (!hostedVariants.has(variant)) {
  process.exit(0);
}

const required = [
  'EXPO_PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_WS_BASE_URL',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_AUTH_MODE',
];
const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  throw new Error(`Hosted web build is missing required environment variables: ${missing.join(', ')}`);
}

const apiUrl = new URL(process.env.EXPO_PUBLIC_API_BASE_URL);
const websocketUrl = new URL(process.env.EXPO_PUBLIC_WS_BASE_URL);
const supabaseUrl = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL);

if (apiUrl.protocol !== 'https:' || supabaseUrl.protocol !== 'https:') {
  throw new Error('Hosted API and Supabase endpoints must use HTTPS');
}
if (websocketUrl.protocol !== 'wss:') {
  throw new Error('Hosted realtime endpoint must use WSS');
}
if (variant === 'alpha' && process.env.EXPO_PUBLIC_AUTH_MODE !== 'email') {
  throw new Error('The zero-cost alpha must use email-link authentication');
}
if (variant === 'production' && process.env.EXPO_PUBLIC_AUTH_MODE !== 'phone') {
  throw new Error('Production must use phone authentication');
}

console.log(`Validated required public configuration for the ${variant} web build.`);
