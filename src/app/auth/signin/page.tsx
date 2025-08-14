'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SignInContent } from './signin-content';

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
          <div className="w-full max-w-md space-y-6">
            <Skeleton className="h-10 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}

// Rest of the code remains the same
