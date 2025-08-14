import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/components/ui/use-toast';

export const useOtpAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { setOtpSent, setOtpVerified, setUser } = useAuthStore();

  // Simulate sending OTP
  const sendOtp = async (phoneNumber: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you would call your backend API here
    console.log(`OTP sent to ${phoneNumber}`);
    
    setOtpSent(true);
    setIsLoading(false);
    
    // Start countdown for resend OTP
    startCountdown();
    
    toast({
      title: "OTP Sent",
      description: `A verification code has been sent to ${phoneNumber}`,
    });
  };

  // Verify OTP
  const verifyOtp = async (otp: string) => {
    setIsLoading(true);
    
    // Simulate API verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, you would verify the OTP with your backend
    const isValid = otp.length === 6 && /^\d+$/.test(otp);
    
    if (isValid) {
      // Simulate user data from backend
      setUser({
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        phoneNumber: '+1234567890',
      });
      
      setOtpVerified(true);
      toast({
        title: "Verification Successful",
        description: "You have been successfully logged in!",
      });
    } else {
      toast({
        title: "Invalid OTP",
        description: "The verification code you entered is invalid. Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
    return isValid;
  };

  // Start countdown for resend OTP
  const startCountdown = () => {
    let timeLeft = 30; // 30 seconds countdown
    setCountdown(timeLeft);
    
    const timer = setInterval(() => {
      timeLeft--;
      setCountdown(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  };

  return {
    isLoading,
    countdown,
    sendOtp,
    verifyOtp,
  };
};
