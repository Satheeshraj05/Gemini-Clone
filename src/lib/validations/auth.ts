import { z } from 'zod';

// Phone number validation schema
export const phoneSchema = z.object({
  phoneNumber: z.string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[0-9\s-()]+$/, 'Please enter a valid phone number')
    .min(6, 'Phone number must be at least 6 digits')
    .max(20, 'Phone number is too long'),
  countryCode: z.string().optional(),
});

// OTP validation schema
export const otpSchema = z.object({
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});

// Chat form validation schema
export const chatSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title is too long (max 100 characters)'),
  message: z.string()
    .max(5000, 'Message is too long (max 5000 characters)')
    .optional(),
});

// Export types
export type PhoneFormValues = z.infer<typeof phoneSchema>;
export type OtpFormValues = z.infer<typeof otpSchema>;
export type ChatFormValues = z.infer<typeof chatSchema>;
