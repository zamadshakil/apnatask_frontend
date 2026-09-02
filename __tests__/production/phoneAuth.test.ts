import { phoneAuthErrorKey, phoneAuthSchema } from '../../src/validation/phoneAuth';

describe('phone authentication validation', () => {
  it('allows an empty OTP while requesting the first code', () => {
    expect(phoneAuthSchema.safeParse({ phone: '03000000001', otp: '' }).success).toBe(true);
  });

  it('requires exactly six digits once an OTP is entered', () => {
    expect(phoneAuthSchema.safeParse({ phone: '03000000001', otp: '12345' }).success).toBe(false);
    expect(phoneAuthSchema.safeParse({ phone: '03000000001', otp: '123456' }).success).toBe(true);
  });

  it('maps authentication failures to actionable recovery messages', () => {
    expect(phoneAuthErrorKey('Enter a valid Pakistani mobile number', false)).toBe('invalidPhone');
    expect(phoneAuthErrorKey('Too many requests', false)).toBe('rateLimited');
    expect(phoneAuthErrorKey('Failed to fetch', true)).toBe('localOffline');
    expect(phoneAuthErrorKey('SMS provider unavailable', false)).toBe('serviceUnavailable');
  });
});
