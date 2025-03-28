"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSupabaseAuth } from "./supabase-auth-provider"

interface AuthWallProps {
  onClose: () => void
  onSignup: (email: string) => void
}

export function AuthWall({ onClose, onSignup }: AuthWallProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { signInWithGoogle, user } = useSupabaseAuth()

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true)
    
    try {
      await signInWithGoogle()
      // The page will redirect to Google OAuth
    } catch (error) {
      console.error("Google sign-in error:", error)
      setIsSubmitting(false)
    }
  }

  // Close the modal if user becomes authenticated
  useEffect(() => {
    if (user) {
      onSignup(user.email || "user@example.com")
      onClose()
    }
  }, [user, onClose, onSignup])

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#6D6E71] max-w-md w-full p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#F0EFE9] hover:text-white">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-poppins text-[#F0EFE9] mb-6 text-center">
          Create a free account to view unlimited ads today
        </h2>

        <div className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full bg-white hover:bg-gray-100 text-gray-800 font-sans py-6 px-4 flex items-center justify-center space-x-2 border border-gray-300"
          >
            {/* Google logo */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="mr-2">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>

            {isSubmitting ? "Signing in..." : "Continue with Google"}
          </Button>

          <div className="text-center text-[#F0EFE9] text-sm font-sans mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  )
}

