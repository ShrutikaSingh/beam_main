'use client'

import { useSupabaseAuth } from "./supabase-auth-provider"
import { Button } from "@/components/ui/button"

export function UserProfile() {
  const { user, signOut, isLoading } = useSupabaseAuth()
  
  if (isLoading) {
    return <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
  }
  
  if (!user) {
    return null
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
        {user.email?.[0]?.toUpperCase() || 'U'}
      </div>
      <span className="text-sm">{user.email}</span>
      <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
    </div>
  )
} 