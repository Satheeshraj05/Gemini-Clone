'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { OtpInput } from './otp-input';

interface OtpVerificationFormProps {
  phoneNumber: string;
  countryCode: string;
  onSuccess: (otp: string) => void;
  onResend: () => Promise<boolean>;
  otpLength?: number;
  resendTimeout?: number;
}

export function OtpVerificationForm({
  phoneNumber,
  countryCode,
  onSuccess,
  onResend,
  otpLength = 6,
  resendTimeout = 30,
}: OtpVerificationFormProps) {
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== otpLength) {
      toast({
        title: 'Invalid OTP',
        description: `Please enter a ${otpLength}-digit code`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // The actual verification is now handled by the parent component
      // which calls our API endpoint that verifies with Twilio
      onSuccess(otp);
    } catch (error) {
      console.error('OTP verification failed:', error);
      toast({
        title: 'Verification failed',
        description: 'The verification code is invalid or has expired. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    
    try {
      const success = await onResend();
      if (success) {
        setCountdown(resendTimeout);
        startCountdown();
        toast({
          title: 'Code sent',
          description: `A new verification code has been sent to ${countryCode} ${phoneNumber}`,
        });
      }
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      toast({
        title: 'Failed to resend code',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  const startCountdown = () => {
    let timer = resendTimeout;
    
    const interval = setInterval(() => {
      timer--;
      setCountdown(timer);
      
      if (timer <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  };

  // Generate a test OTP in development
  const testOtp = Array(otpLength).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
  
  return (
    <div className="space-y-6 w-full">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Verify your phone</h2>
        <p className="text-muted-foreground">
          We've sent a verification code to <span className="font-medium">{countryCode} {phoneNumber}</span>
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm">
            <p className="font-medium">Development Mode</p>
            <p className="text-muted-foreground">Test OTP: <span className="font-mono font-bold">{testOtp}</span></p>
            <p className="text-xs text-muted-foreground mt-1">(This is only visible in development)</p>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center">
          <OtpInput
            value={otp}
            valueLength={otpLength}
            onChange={setOtp}
            disabled={isSubmitting}
          />
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || otp.length !== otpLength}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </Button>
        
        <div className="text-center text-sm text-muted-foreground">
          Didn't receive a code?{' '}
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending || countdown > 0}
            className="text-primary font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? (
              'Sending...'
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              'Resend code'
            )}
          </button>
        </div>
      </form>
      
      <div className="text-center text-xs text-muted-foreground">
        {process.env.NODE_ENV === 'development' ? (
          <p>For testing, use the OTP shown above</p>
        ) : (
          <p>For demonstration purposes, any {otpLength}-digit code will work</p>
        )}
      </div>
    </div>
  );
}
