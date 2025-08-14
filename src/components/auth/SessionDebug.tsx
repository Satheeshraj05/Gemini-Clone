'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export function SessionDebug() {
  const { data: session, status, update } = useSession();
  
  useEffect(() => {
    console.group('=== Auth Session Debug ===');
    console.log('Session Status:', status);
    console.log('Session Data:', session);
    console.log('Current URL:', window.location.href);
    console.log('Cookies:', document.cookie);
    console.groupEnd();
    
    // Log when the component mounts and unmounts
    console.log('SessionDebug mounted');
    
    return () => {
      console.log('SessionDebug unmounted');
    };
  }, [session, status]);
  
  // Check for callback URL after sign in
  useEffect(() => {
    if (status === 'authenticated' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const callbackUrl = url.searchParams.get('callbackUrl');
      
      if (callbackUrl) {
        console.log('Found callback URL:', callbackUrl);
        // Remove the callbackUrl from the URL
        url.searchParams.delete('callbackUrl');
        window.history.replaceState({}, '', url.toString());
        
        // Navigate to the callback URL
        console.log('Redirecting to callback URL:', callbackUrl);
        window.location.href = callbackUrl;
      }
    }
  }, [status]);
  
  return null; // This component doesn't render anything
}
