"use client"

import type React from "react"
import { useState } from "react"
import { Check, Copy } from "lucide-react"

interface CopyToClipboardProps {
  imageUrl: string
  alt: string
}

export function CopyToClipboard({ imageUrl, alt }: CopyToClipboardProps) {
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyImageToClipboard = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the parent's onClick

    if (copying || copied) return

    setCopying(true)

    try {
      // Convert relative URL to absolute URL
      const absoluteUrl = new URL(imageUrl, window.location.origin).href

      // Fetch the image as a blob
      const response = await fetch(absoluteUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()

      // Create a ClipboardItem and write to clipboard
      const item = new ClipboardItem({ [blob.type]: blob })
      await navigator.clipboard.write([item])

      // Show success state
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error("Failed to copy image: ", err)

      // Fallback for browsers that don't support clipboard.write with images
      alert("Your browser doesn't support copying images directly. Please try right-clicking and saving it manually.")
    } finally {
      setCopying(false)
    }
  }

  return (
    <button
      onClick={copyImageToClipboard}
      className="absolute bottom-3 right-3 bg-[#F0EFE9] text-[#333333] px-3 py-2 rounded-md shadow-md flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          <span className="text-sm font-sans">Copied</span>
        </>
      ) : copying ? (
        <>
          <span className="h-4 w-4 rounded-full border-2 border-[#333333] border-t-transparent animate-spin mr-2"></span>
          <span className="text-sm font-sans">Copying...</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span className="text-sm font-sans">Copy</span>
        </>
      )}
    </button>
  )
}

