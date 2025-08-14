'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/store/auth-store';

export function AuthSync() {
  const { data: session, status } = useSession();
  const { setUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Update Zustand store with session data
      setUser({
        id: session.user.id || '',
        email: session.user.email || '',
        name: session.user.name || '',
        phoneNumber: (session.user as any).phoneNumber || '',
      });
    } else if (status === 'unauthenticated' && isAuthenticated) {
      // Clear Zustand store if session is invalid
      useAuthStore.getState().logout();
    }
  }, [session, status, setUser, isAuthenticated]);

  return null;
}

export default AuthSync;
