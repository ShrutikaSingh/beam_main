"use client"

import { useState, useEffect } from "react"
import { useSupabaseAuth } from "@/components/supabase-auth-provider"

const SCROLL_STORAGE_KEY = "viewed_ads_count"
const MODAL_STORAGE_KEY = "viewed_modal_count"
const FREE_SCROLL_LIMIT = 50
const FREE_MODAL_LIMIT = 5 // Limit for modal views

// Set this to true to enable auth walls
const AUTH_ENABLED = false

export function useViewedCount() {
  const [scrollViewCount, setScrollViewCount] = useState(0)
  const [modalViewCount, setModalViewCount] = useState(0)
  const [showAuthWall, setShowAuthWall] = useState(false)
  const [authTrigger, setAuthTrigger] = useState<"scroll" | "modal" | null>(null)
  
  // Use real auth state from Supabase
  const { user } = useSupabaseAuth()
  const isAuthenticated = !!user

  // Load initial counts from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedScrollCount = localStorage.getItem(SCROLL_STORAGE_KEY)
      if (storedScrollCount) {
        setScrollViewCount(Number.parseInt(storedScrollCount, 10))
      }

      const storedModalCount = localStorage.getItem(MODAL_STORAGE_KEY)
      if (storedModalCount) {
        setModalViewCount(Number.parseInt(storedModalCount, 10))
      }
    }
  }, [])

  // Update localStorage when scroll count changes and check if limit reached
  useEffect(() => {
    if (typeof window !== "undefined" && scrollViewCount > 0) {
      localStorage.setItem(SCROLL_STORAGE_KEY, scrollViewCount.toString())

      // Show auth wall if over limit and not authenticated (and auth is enabled)
      if (AUTH_ENABLED && scrollViewCount > FREE_SCROLL_LIMIT && !isAuthenticated && !showAuthWall) {
        setShowAuthWall(true)
        setAuthTrigger("scroll")
      }
    }
  }, [scrollViewCount, isAuthenticated, showAuthWall])

  // Update localStorage when modal count changes and check if limit reached
  useEffect(() => {
    if (typeof window !== "undefined" && modalViewCount > 0) {
      localStorage.setItem(MODAL_STORAGE_KEY, modalViewCount.toString())

      // Show auth wall if over limit and not authenticated (and auth is enabled)
      if (AUTH_ENABLED && modalViewCount > FREE_MODAL_LIMIT && !isAuthenticated && !showAuthWall) {
        setShowAuthWall(true)
        setAuthTrigger("modal")
      }
    }
  }, [modalViewCount, isAuthenticated, showAuthWall])

  // Close auth wall if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && showAuthWall) {
      closeAuthWall()
    }
  }, [isAuthenticated, showAuthWall])

  const incrementScrollCount = () => {
    setScrollViewCount((prev) => prev + 1)
  }

  const incrementModalCount = () => {
    setModalViewCount((prev) => prev + 1)
  }

  const handleSignup = (email: string) => {
    // No longer need to set localStorage auth flag since we use Supabase auth
    closeAuthWall()
  }

  const closeAuthWall = () => {
    setShowAuthWall(false)
    setAuthTrigger(null)
  }

  return {
    scrollViewCount,
    modalViewCount,
    incrementScrollCount,
    incrementModalCount,
    showAuthWall,
    closeAuthWall,
    handleSignup,
    isAuthenticated,
    authTrigger,
    // If auth is disabled, always return false for limit checks
    isScrollLimitReached: AUTH_ENABLED ? scrollViewCount > FREE_SCROLL_LIMIT && !isAuthenticated : false,
    isModalLimitReached: AUTH_ENABLED ? modalViewCount > FREE_MODAL_LIMIT && !isAuthenticated : false,
  }
}

