"use client"

import { useState } from "react"
import { FeedbackModal } from "@/components/feedback-modal"
import Link from "next/link"

export function Navbar() {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#333333]/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo wordmark */}
          <a href="/" className="font-instrument text-2xl md:text-3xl text-[#F0EFE9] hover:text-white transition-colors duration-200">
            beam.new
          </a>

          {/* Contact button - Changed to mailto link */}
          <a
            href="mailto:safwaan@ravahq.com?subject=Ideas%20for%20``"
            className="bg-[#F0EFE9] hover:bg-white text-[#333333] px-4 py-2 rounded-md text-sm font-sans transition-colors duration-200"
          >
            Ideas? Contact the devs
          </a>
        </div>
      </div>

      {/* Feedback Modal - rendered outside the navbar for better positioning */}
      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
    </>
  )
}

