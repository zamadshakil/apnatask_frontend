import { z } from 'zod';

export const phoneAuthSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().refine((value) => value === '' || /^\d{6}$/.test(value), 'Enter the 6-digit code'),
});

export const emailAuthSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  otp: z.string().refine((value) => value === '' || /^\d{6}$/.test(value), 'Enter the 6-digit code'),
});

export type PhoneAuthFormData = z.infer<typeof phoneAuthSchema>;
export type EmailAuthFormData = z.infer<typeof emailAuthSchema>;

export type PhoneAuthErrorKey = 'invalidPhone' | 'inviteOnly' | 'rateLimited' | 'serviceUnavailable' | 'localOffline' | 'retry';

export function phoneAuthErrorKey(detail: string, localPreview: boolean): PhoneAuthErrorKey {
  const normalized = detail.toLowerCase();
  if (/valid pakistani|invalid phone|phone number.*invalid/.test(normalized)) return 'invalidPhone';
  if (/signups?.*(not allowed|disabled)|user.*not found/.test(normalized)) return 'inviteOnly';
  if (/too many|rate limit|429/.test(normalized)) return 'rateLimited';
  if (/fetch|network|connection/.test(normalized)) return localPreview ? 'localOffline' : 'serviceUnavailable';
  if (/captcha|sms|provider|disabled|unavailable/.test(normalized)) return 'serviceUnavailable';
  return 'retry';
}
