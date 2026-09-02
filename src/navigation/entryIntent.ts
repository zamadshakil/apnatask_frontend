export type EntryIntent = 'customer' | 'provider';
export type EntryDestination = '/(customer)/(tabs)' | '/(customer)/(tabs)/account' | '/(provider)/apply' | '/provider';

type EntryUser = {
  capabilities: readonly string[];
  provider_kyc_status?: string | null;
};

export function parseEntryIntent(value: string | string[] | undefined): EntryIntent {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === 'provider' ? 'provider' : 'customer';
}

export function resolveEntryDestination(intent: EntryIntent, user: EntryUser): EntryDestination {
  if (intent === 'customer') return '/(customer)/(tabs)';
  if (user.capabilities.includes('provider')) return '/provider';
  if (user.provider_kyc_status === 'pending') return '/(customer)/(tabs)/account';
  return '/(provider)/apply';
}
