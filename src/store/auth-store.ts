import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: {
    id: string;
    email: string;
    name: string;
    phoneNumber: string;
  } | null;
  isAuthenticated: boolean;
  otpSent: boolean;
  otpVerified: boolean;
  setUser: (user: AuthState['user']) => void;
  setOtpSent: (sent: boolean) => void;
  setOtpVerified: (verified: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      otpSent: false,
      otpVerified: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setOtpSent: (otpSent) => set({ otpSent }),
      setOtpVerified: (otpVerified) => set({ otpVerified }),
      logout: () => set({ user: null, isAuthenticated: false, otpSent: false, otpVerified: false }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
    }
  )
);
