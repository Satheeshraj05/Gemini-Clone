import { z } from 'zod';

export const phoneNumberSchema = z.object({
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .min(5, 'Phone number must be at least 5 digits')
    .max(20, 'Phone number is too long')
    .regex(/^[0-9\s\-()]+$/, 'Please enter a valid phone number'),
  // Keep countryCode for backward compatibility and reference
  countryCode: z.string().optional(),
});

export const otpSchema = z.object({
  otp: z.string().length(6, 'Verification code must be 6 digits'),
});

export type PhoneNumberFormValues = z.infer<typeof phoneNumberSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
