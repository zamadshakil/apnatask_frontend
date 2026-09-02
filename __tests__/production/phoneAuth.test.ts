import { emailAuthSchema, phoneAuthErrorKey, phoneAuthSchema } from '../../src/validation/phoneAuth';

describe('phone authentication validation', () => {
  it('allows an empty OTP while requesting the first code', () => {
    expect(phoneAuthSchema.safeParse({ phone: '03000000001', otp: '' }).success).toBe(true);
  });

  it('requires exactly six digits once an OTP is entered', () => {
    expect(phoneAuthSchema.safeParse({ phone: '03000000001', otp: '12345' }).success).toBe(false);
    expect(phoneAuthSchema.safeParse({ phone: '03000000001', otp: '123456' }).success).toBe(true);
  });

  it('validates the email OTP identity used by the zero-cost alpha', () => {
    expect(emailAuthSchema.safeParse({ email: 'owner+provider@example.com', otp: '' }).success).toBe(true);
    expect(emailAuthSchema.safeParse({ email: 'not-an-email', otp: '' }).success).toBe(false);
  });

  it('maps authentication failures to actionable recovery messages', () => {
    expect(phoneAuthErrorKey('Enter a valid Pakistani mobile number', false)).toBe('invalidPhone');
    expect(phoneAuthErrorKey('Signups not allowed for otp', false)).toBe('inviteOnly');
    expect(phoneAuthErrorKey('Too many requests', false)).toBe('rateLimited');
    expect(phoneAuthErrorKey('Failed to fetch', true)).toBe('localOffline');
    expect(phoneAuthErrorKey('SMS provider unavailable', false)).toBe('serviceUnavailable');
  });
});
