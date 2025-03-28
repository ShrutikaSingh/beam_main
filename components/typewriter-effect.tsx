"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface TypewriterEffectProps {
  phrases: string[]
  typingSpeed?: number
  deletingSpeed?: number
  pauseTime?: number
}

export const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  phrases,
  typingSpeed = 50,
  deletingSpeed = 30,
  pauseTime = 2000,
}) => {
  const [currentText, setCurrentText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const currentPhrase = phrases[currentIndex]

    if (isPaused) {
      const pauseTimeout = setTimeout(() => {
        setIsPaused(false)
        setIsDeleting(true)
      }, pauseTime)

      return () => clearTimeout(pauseTimeout)
    }

    const timeout = setTimeout(
      () => {
        // Typing
        if (!isDeleting && currentText.length < currentPhrase.length) {
          setCurrentText(currentPhrase.substring(0, currentText.length + 1))
          return
        }

        // Pause when finished typing
        if (!isDeleting && currentText.length === currentPhrase.length) {
          setIsPaused(true)
          return
        }

        // Deleting
        if (isDeleting && currentText.length > 0) {
          setCurrentText(currentText.substring(0, currentText.length - 1))
          return
        }

        // Move to next phrase
        if (isDeleting && currentText.length === 0) {
          setIsDeleting(false)
          setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length)
        }
      },
      isDeleting ? deletingSpeed : typingSpeed,
    )

    return () => clearTimeout(timeout)
  }, [currentText, currentIndex, isDeleting, isPaused, phrases, typingSpeed, deletingSpeed, pauseTime])

  return (
    <span>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

