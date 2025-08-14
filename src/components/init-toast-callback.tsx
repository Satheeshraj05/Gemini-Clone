"use client";

import { useEffect } from 'react';
import { useToastNotification } from '@/hooks/use-toast-notification';
import { setToastCallback } from '@/store/chat-store';

export function InitToastCallback() {
  const toast = useToastNotification();

  useEffect(() => {
    // Set the toast callback in the chat store
    setToastCallback((message, type, options) => {
      switch (type) {
        case 'success':
          return toast.showSuccess(message, options?.description, options?.durationMs);
        case 'error':
          return toast.showError(message, options?.description, options?.durationMs);
        case 'info':
          return toast.showInfo(message, options?.description, options?.durationMs);
        case 'warning':
          return toast.showWarning(message, options?.description, options?.durationMs);
        default:
          return toast.showToast(message, 'info', options);
      }
    });

    // Cleanup function to clear the callback when the component unmounts
    return () => {
      setToastCallback(null);
    };
  }, [toast]);

  return null;
}

export default InitToastCallback;
