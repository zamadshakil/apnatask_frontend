import { parseEntryIntent, resolveEntryDestination } from '../../src/navigation/entryIntent';

describe('entry intent', () => {
  it('allows the provider onboarding intent', () => {
    expect(parseEntryIntent('provider')).toBe('provider');
  });

  it.each([undefined, 'customer', 'admin', 'provider/../admin'])(
    'defaults an untrusted %p value to customer',
    (value) => expect(parseEntryIntent(value)).toBe('customer'),
  );

  it('uses only the first query value', () => {
    expect(parseEntryIntent(['provider', 'customer'])).toBe('provider');
  });

  it('sends an approved provider to provider mode', () => {
    expect(resolveEntryDestination('provider', { capabilities: ['customer', 'provider'], provider_kyc_status: 'approved' })).toBe('/provider');
  });

  it('shows a pending applicant their account status', () => {
    expect(resolveEntryDestination('provider', { capabilities: ['customer'], provider_kyc_status: 'pending' })).toBe('/(customer)/(tabs)/account');
  });

  it.each([null, 'not_submitted', 'rejected'])(
    'routes %p provider state to the application flow',
    (provider_kyc_status) => expect(resolveEntryDestination('provider', { capabilities: ['customer'], provider_kyc_status })).toBe('/(provider)/apply'),
  );

  it('keeps customer intent in customer mode even for an approved provider', () => {
    expect(resolveEntryDestination('customer', { capabilities: ['customer', 'provider'], provider_kyc_status: 'approved' })).toBe('/(customer)/(tabs)');
  });
});
