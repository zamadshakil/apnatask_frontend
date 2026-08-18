import { phoneAuthSchema } from '../../src/validation/phoneAuth';

describe('phone authentication validation', () => {
  it('allows an empty OTP while requesting the first code', () => {
    expect(phoneAuthSchema.safeParse({ phone: '03000000001', otp: '' }).success).toBe(true);
  });

  it('requires exactly six digits once an OTP is entered', () => {
    expect(phoneAuthSchema.safeParse({ phone: '03000000001', otp: '12345' }).success).toBe(false);
    expect(phoneAuthSchema.safeParse({ phone: '03000000001', otp: '123456' }).success).toBe(true);
  });
});
