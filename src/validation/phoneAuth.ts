import { z } from 'zod';

export const phoneAuthSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().refine((value) => value === '' || /^\d{6}$/.test(value), 'Enter the 6-digit code'),
});

export type PhoneAuthFormData = z.infer<typeof phoneAuthSchema>;
