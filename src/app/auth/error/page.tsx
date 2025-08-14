'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const router = useRouter();

  useEffect(() => {
    // If there's no error, redirect to the home page
    if (!error) {
      router.push('/');
    }
  }, [error, router]);

  if (!error) {
    return null;
  }

  const errorMessages: Record<string, string> = {
    Signin: 'Try signing in with a different account.',
    OAuthSignin: 'Try signing in with a different account.',
    OAuthCallback: 'Try signing in with a different account.',
    OAuthCreateAccount: 'Try signing in with a different account.',
    EmailCreateAccount: 'Try signing in with a different account.',
    Callback: 'Try signing in with a different account.',
    OAuthAccountNotLinked:
      'To confirm your identity, sign in with the same account you used originally.',
    EmailSignin: 'Check your email address.',
    CredentialsSignin:
      'Sign in failed. Check the details you provided are correct.',
    default: 'Unable to sign in.',
  };

  const errorMessage = error && (errorMessages[error] ?? errorMessages.default);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            <p className="mb-4">{errorMessage}</p>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="mt-2"
            >
              Return to Home
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
