'use client';

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/header";
import { InitToastCallback } from "@/components/init-toast-callback";
import { AuthSync } from "@/components/auth/AuthSync";
import { SessionDebug } from "@/components/auth/SessionDebug";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <InitToastCallback />
          <AuthSync />
          <SessionDebug />
        </div>
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  );
}
