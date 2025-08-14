"use client"

import { useToast } from "@/components/ui/use-toast"
import { useCallback } from "react"

type ToastType = 'success' | 'error' | 'info' | 'warning'

type ToastOptions = {
  description?: string;
  durationMs?: number;
}

type UseToastNotificationReturn = {
  showToast: (title: string, type?: ToastType, options?: ToastOptions) => void;
  showSuccess: (message: string, description?: string, durationMs?: number) => void;
  showError: (message: string, description?: string, durationMs?: number) => void;
  showInfo: (message: string, description?: string, durationMs?: number) => void;
  showWarning: (message: string, description?: string, durationMs?: number) => void;
}

export function useToastNotification(): UseToastNotificationReturn {
  const { toast } = useToast()

  const showToast = useCallback((
    title: string,
    type: ToastType = 'info',
    options: ToastOptions = {}
  ) => {
    const { description, durationMs = 3000 } = options;
    
    toast({
      title,
      description,
      variant: type === 'error' ? 'destructive' : 'default',
      // @ts-ignore - duration is a valid property in the toast component
      duration: durationMs,
    });
  }, [toast]);

  const showSuccess = useCallback((message: string, description?: string, durationMs?: number) => {
    showToast(message, 'success', { description, durationMs });
  }, [showToast]);

  const showError = useCallback((message: string, description?: string, durationMs?: number) => {
    showToast(message, 'error', { description, durationMs });
  }, [showToast]);

  const showInfo = useCallback((message: string, description?: string, durationMs?: number) => {
    showToast(message, 'info', { description, durationMs });
  }, [showToast]);

  const showWarning = useCallback((message: string, description?: string, durationMs?: number) => {
    showToast(message, 'warning', { description, durationMs });
  }, [showToast]);

  return {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
}
