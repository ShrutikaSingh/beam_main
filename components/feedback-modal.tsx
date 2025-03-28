"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

interface FeedbackModalProps {
  onClose: () => void
}

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    feedback: "",
    category: "suggestion",
  })

  // Prevent body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setSubmitted(true)

      // Close the modal after showing success message
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error submitting feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#6D6E71] max-w-md w-full p-8 relative rounded-lg my-8 mx-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#F0EFE9] hover:text-white"
          aria-label="Close feedback form"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="text-center py-8">
            <h2 className="text-2xl font-poppins text-[#F0EFE9] mb-4">Thank you!</h2>
            <p className="text-[#F0EFE9] font-sans">We appreciate your feedback and will review it shortly.</p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-poppins text-[#F0EFE9] mb-6">Help us improve beam.new</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-[#F0EFE9] font-sans text-sm mb-1">
                  Your email (optional)
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className="bg-[#F0EFE9] text-[#333333] border-[#9A9B9D] focus-visible:ring-[#9A9B9D] font-sans"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-[#F0EFE9] font-sans text-sm mb-1">
                  What would you like to share?
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-[#F0EFE9] text-[#333333] border-[#9A9B9D] rounded-md py-2 px-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#9A9B9D]"
                >
                  <option value="suggestion">Feature suggestion</option>
                  <option value="brands">Brands I want to track</option>
                  <option value="images">Types of images I want to see</option>
                  <option value="bug">Report a bug</option>
                  <option value="other">Other feedback</option>
                </select>
              </div>

              <div>
                <label htmlFor="feedback" className="block text-[#F0EFE9] font-sans text-sm mb-1">
                  Your feedback
                </label>
                <Textarea
                  id="feedback"
                  name="feedback"
                  value={formData.feedback}
                  onChange={handleChange}
                  placeholder="Share your ideas, suggestions, or report issues..."
                  className="bg-[#F0EFE9] text-[#333333] border-[#9A9B9D] focus-visible:ring-[#9A9B9D] font-sans min-h-[120px]"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#F0EFE9] hover:bg-white text-[#333333] font-sans py-2"
              >
                {isSubmitting ? "Submitting..." : "Submit feedback"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

