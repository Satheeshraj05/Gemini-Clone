'use client';

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { PhoneInput } from "@/components/auth/phone-input";
import { OtpVerificationForm } from "@/components/auth/otp-verification-form";
import { phoneNumberSchema, PhoneNumberFormValues } from "@/validations/auth";

export function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [verificationData, setVerificationData] = useState<{
    phoneNumber: string;
    countryCode: string;
  } | null>(null);

  const form = useForm<PhoneNumberFormValues>({
    resolver: zodResolver(phoneNumberSchema),
    defaultValues: {
      countryCode: '+1',
      phoneNumber: '',
    },
  });

  // Check for verification success or error messages in the URL
  useEffect(() => {
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');

    if (verified === 'true') {
      toast({
        title: 'Verification successful!',
        description: 'Your phone has been verified. You can now sign in.',
        variant: 'default',
      });
    } else if (error) {
      let errorMessage = 'An error occurred during verification.';
      
      if (error === 'VerificationFailed') {
        errorMessage = 'The verification code is invalid or has expired.';
      } else if (error === 'InvalidToken') {
        errorMessage = 'The verification token is invalid.';
      }
      
      toast({
        title: 'Verification failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [searchParams]);

  const formatPhoneNumber = (countryCode: string | undefined, phoneNumber: string): string => {
    // Ensure country code has + and phone number has no non-digit characters
    const cleanCountryCode = (countryCode || '+1').replace(/\D/g, ''); // Default to +1 if not provided
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Return in E.164 format: +[country code][number]
    return `+${cleanCountryCode}${cleanNumber}`;
  };

  const onSubmit = async (data: PhoneNumberFormValues) => {
    setIsLoading(true);
    try {
      const phoneNumber = formatPhoneNumber(data.countryCode, data.phoneNumber);
      
      // Call our API to send OTP via Twilio
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send verification code');
      }
      
      setVerificationData({
        phoneNumber: data.phoneNumber,
        countryCode: data.countryCode || '+1',
      });
      setShowOtpForm(true);
      
      toast({
        title: 'Verification code sent',
        description: 'Please check your phone for the verification code.',
      });
      
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send verification code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerification = async (otp: string) => {
    if (!verificationData) return;
    
    setIsLoading(true);
    try {
      const phoneNumber = formatPhoneNumber(verificationData.countryCode, verificationData.phoneNumber);
      
      // Sign in with credentials (OTP will be verified in the authorize callback)
      const signInResult = await signIn('credentials', {
        phoneNumber: phoneNumber,
        otp: otp,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      // Redirect to dashboard on successful sign-in
      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to verify OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (showOtpForm && verificationData) {
    return (
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Verify your phone</h1>
            <p className="text-muted-foreground">
              We've sent a verification code to {verificationData.countryCode}{verificationData.phoneNumber}
            </p>
          </div>
          <OtpVerificationForm 
            phoneNumber={verificationData.phoneNumber}
            countryCode={verificationData.countryCode}
            onSuccess={handleOtpVerification}
            onResend={async () => {
              console.log('Resend code');
              return true; // Return true if resend was successful
            }}
            otpLength={6}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in with your phone</h1>
          <p className="text-muted-foreground">
            We'll send you a verification code to sign in
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <PhoneInput
                      value={form.watch('phoneNumber') || ''}
                      onChange={(value) => {
                        form.setValue('phoneNumber', value, { shouldValidate: true });
                      }}
                      onCountrySelect={(country) => {
                        form.setValue('countryCode', country.dial_code, { shouldValidate: true });
                      }}
                      defaultCountry="US"
                      disabled={isLoading}
                      className="w-full"
                      inputClassName="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </form>
        </Form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        
        <Button variant="outline" type="button" className="w-full" disabled={isLoading}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
      </div>
    </div>
  );
}
