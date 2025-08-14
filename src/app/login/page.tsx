'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { PhoneInput } from '@/components/auth/phone-input';
import { useOtpAuth } from '@/hooks/use-otp-auth';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { OTPInput } from '@/components/ui/otp-input';

// Define form schemas
const phoneFormSchema = z.object({
  phoneNumber: z.string()
    .min(1, 'Phone number is required')
    .regex(/^\+?[0-9\s-()]+$/, 'Please enter a valid phone number')
    .min(6, 'Phone number must be at least 6 digits')
    .max(20, 'Phone number is too long'),
  countryCode: z.string().optional(),
});

const otpFormSchema = z.object({
  otp: z.string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d+$/, 'OTP must contain only numbers'),
});

type PhoneFormValues = z.infer<typeof phoneFormSchema>;
type OtpFormValues = z.infer<typeof otpFormSchema>;

interface Country {
  code: string;
  dial_code: string;
  emoji: string;
  name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { sendOtp, countdown, verifyOtp } = useOtpAuth();
  const { otpSent, setOtpSent, setOtpVerified, setUser } = useAuthStore();
  
  // Phone form
  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: {
      phoneNumber: '',
      countryCode: '+1', // Default country code
    },
  });
  
  // OTP form
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      otp: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'US',
    dial_code: '+1',
    emoji: '🇺🇸',
    name: 'United States',
  });
  
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Handle phone form submission
  const onPhoneSubmit = async (data: PhoneFormValues) => {
    setIsSubmitting(true);
    try {
      // Format phone number with country code
      const fullPhoneNumber = `${selectedCountry.dial_code}${data.phoneNumber.replace(/\D/g, '')}`;
      await sendOtp(fullPhoneNumber);
      setOtpSent(true);
      toast({
        title: 'OTP Sent',
        description: `A verification code has been sent to ${fullPhoneNumber}`,
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: 'Error',
        description: 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP form submission
  const onOtpSubmit = async (data: OtpFormValues) => {
    setIsSubmitting(true);
    try {
      const isValid = await verifyOtp(data.otp);
      if (isValid) {
        setOtpVerified(true);
        // In a real app, you would get this from the API response
        setUser({
          id: 'user-123',
          email: 'user@example.com',
          name: 'John Doe',
          phoneNumber: phoneForm.getValues('phoneNumber'),
        });
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle country selection
  const handleCountrySelect = useCallback((country: Country) => {
    setSelectedCountry(country);
    phoneForm.setValue('countryCode', country.dial_code);
    // Focus the phone input after country selection
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 0);
  }, [phoneForm]);

  // Handle resend OTP
  const handleResendOtp = async () => {
    const phoneNumber = phoneForm.getValues('phoneNumber');
    if (!phoneNumber) return;
    
    try {
      await sendOtp(`${selectedCountry.dial_code}${phoneNumber.replace(/\D/g, '')}`);
      toast({
        title: 'OTP Resent',
        description: 'A new verification code has been sent to your phone.',
      });
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend OTP. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {otpSent ? 'Verify your phone' : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {otpSent 
              ? `Enter the 6-digit code sent to ${selectedCountry.dial_code}${phoneForm.watch('phoneNumber')}`
              : 'Enter your phone number to sign in to your account'}
          </p>
        </div>
        
        <div className="grid gap-6">
          {!otpSent ? (
            <Form {...phoneForm}>
              <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                <FormField
                  control={phoneForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <PhoneInput
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            phoneForm.clearErrors('phoneNumber');
                          }}
                          onCountrySelect={handleCountrySelect}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Sending...' : 'Send OTP'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <div className="flex justify-center">
                          <OTPInput
                          value={field.value}
                          valueLength={6}
                          onChange={(value) => {
                            field.onChange(value);
                            otpForm.clearErrors('otp');
                          }}
                          disabled={isSubmitting}
                        />
                        </div>
                      </FormControl>
                      <FormMessage />
                      <div className="mt-2 text-center text-sm">
                        {countdown > 0 ? (
                          <p className="text-muted-foreground">
                            Resend code in {countdown}s
                          </p>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="font-medium text-primary hover:underline"
                            disabled={isSubmitting}
                          >
                            Didn't receive a code? Resend
                          </button>
                        )}
                      </div>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Verifying...' : 'Verify Code'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setOtpSent(false)}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
              </form>
            </Form>
          )}
          
          <p className="px-8 text-center text-sm text-muted-foreground">
            By continuing, you agree to our{' '}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

// OTP Verification Component
function OtpVerification({ phoneNumber }: { phoneNumber: string }) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { verifyOtp } = useOtpAuth();
  const router = useRouter();
  const { countdown } = useOtpAuth();

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await verifyOtp(otp);
      if (isValid) {
        // Redirect to dashboard on successful verification
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    // In a real app, you would call the resend OTP API here
    toast({
      title: 'OTP Resent',
      description: `A new verification code has been sent to ${phoneNumber}`,
    });
  };

  return (
    <div className="mt-4 rounded-lg border bg-card p-6 shadow-sm">
      <div className="space-y-4">
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-medium">Verify your phone number</h3>
          <p className="text-sm text-muted-foreground">
            We've sent a 6-digit code to {phoneNumber}
          </p>
        </div>
        
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="flex justify-center">
            <OtpInput
              value={otp}
              valueLength={6}
              onChange={setOtp}
              disabled={isVerifying}
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isVerifying || otp.length !== 6}>
            {isVerifying ? 'Verifying...' : 'Verify OTP'}
          </Button>
          
          <div className="text-center text-sm">
            {countdown > 0 ? (
              <p className="text-muted-foreground">
                Resend code in {countdown}s
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                className="font-medium text-primary hover:underline"
              >
                Didn't receive a code? Resend
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// Simple OTP input component
function OtpInput({
  value,
  valueLength,
  onChange,
  disabled,
}: {
  value: string;
  valueLength: number;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<HTMLInputElement[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = value.split('');
    newValue[index] = e.target.value.slice(-1); // Get only the last character
    
    // Update the OTP value
    const otp = newValue.join('');
    onChange(otp);

    // Move to next input if there's a value
    if (e.target.value && index < valueLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key down for backspace and arrow keys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      // Move left with left arrow
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < valueLength - 1) {
      // Move right with right arrow
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, valueLength);
    
    if (/^\d+$/.test(pastedData)) {
      onChange(pastedData);
      
      // Focus on the next empty input or the last one if all are filled
      const nextIndex = Math.min(pastedData.length, valueLength - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex space-x-2">
      {Array.from({ length: valueLength }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            if (el) {
              inputRefs.current[index] = el;
            }
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={disabled}
          className="h-12 w-12 rounded-md border border-input bg-background text-center text-xl font-semibold focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}
