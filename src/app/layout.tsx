import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";
import { CleanupExtensions } from "@/components/cleanup-extensions";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Gemini AI Chat",
  description: "A modern AI chat application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable
      )}>
        <CleanupExtensions />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

