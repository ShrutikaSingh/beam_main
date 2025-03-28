"use client"

import type React from "react"
import { useState } from "react"
import { Download } from "lucide-react"

interface DownloadButtonProps {
  imageUrl: string
  alt: string
}

export function DownloadButton({ imageUrl, alt }: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the parent's onClick

    if (downloading) return

    setDownloading(true)

    try {
      // For local images in our app, we need to use the full URL
      const absoluteUrl = new URL(imageUrl, window.location.origin).href

      // Fetch the image as a blob
      const response = await fetch(absoluteUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()

      // Create a temporary link element to download the image
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)

      // Extract filename from URL or use a default name with timestamp
      const filename = imageUrl.split("/").pop() || `image-${Date.now()}.png`
      link.download = filename

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the object URL
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error("Error downloading image:", error)
      alert("Unable to download this image. Please try right-clicking and saving it manually.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      className="absolute bottom-3 left-3 bg-[#F0EFE9] text-[#333333] p-2 rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white flex items-center justify-center w-9 h-9"
      aria-label="Download image"
    >
      {downloading ? (
        <div className="w-4 h-4 rounded-full border-2 border-[#333333] border-t-transparent animate-spin"></div>
      ) : (
        <Download className="h-4 w-4" />
      )}
    </button>
  )
}

