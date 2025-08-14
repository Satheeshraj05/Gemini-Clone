'use client';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { signIn, signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function HomeContent() {
  // Hooks at the top level, in a consistent order
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // If authenticated, redirect to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Unauthenticated: show CTA to sign in with phone
  if (status === 'unauthenticated') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Welcome to Gemini Chat</h1>
            <p className="text-muted-foreground">Sign in to continue to your account</p>
          </div>
          <Button
            className="w-full"
            onClick={() => router.push('/auth/signin?callbackUrl=%2Fdashboard')}
            disabled={isLoading}
          >
            Continue with Phone
          </Button>
        </div>
      </main>
    )
  }

  // Authenticated: brief loader while redirecting (useEffect will push)
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  )
}
