"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, X, Download, Copy, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { TypewriterEffect } from "@/components/typewriter-effect"
import { AuthWall } from "@/components/auth-wall"
import { useViewedCount } from "@/hooks/use-viewed-count"
import { Navbar } from "@/components/navbar"
import { fetchBeamImages, searchImagesByEmbedding, type BeamImage } from "@/lib/api"

// Add a constant at the top of the file, near other constants
const MODAL_ENABLED = true // Set to false to disable the image modal
const USE_EMBEDDING_SEARCH = true // Set to false to disable embedding search

// Suggested searches for creative strategists
const suggestedSearches = ["minimalist product packaging", "korean skincare", "emotional storytelling"]

export default function ImageSearch() {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<BeamImage[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalImages, setTotalImages] = useState(5000) // Will be updated from API response
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [selectedImage, setSelectedImage] = useState<BeamImage | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isEmbeddingSearch, setIsEmbeddingSearch] = useState(false)

  const {
    incrementScrollCount,
    incrementModalCount,
    showAuthWall,
    closeAuthWall,
    handleSignup,
    isScrollLimitReached,
    isModalLimitReached,
    isAuthenticated,
    authTrigger,
    scrollViewCount,
    modalViewCount,
  } = useViewedCount()

  const observer = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const imageObserverRef = useRef<IntersectionObserver | null>(null)

  // Debug log for development
  useEffect(() => {
    console.log(`Scroll views: ${scrollViewCount}, Modal views: ${modalViewCount}`)
  }, [scrollViewCount, modalViewCount])

  // Set up image view tracking for scroll
  useEffect(() => {
    // Wait for results to be loaded and rendered
    if (results.length === 0 || isSearching) return

    // Clean up previous observer
    if (imageObserverRef.current) {
      imageObserverRef.current.disconnect()
    }

    // Create new observer
    imageObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Get the image ID from the data attribute
            const imageId = entry.target.getAttribute("data-image-id")
            if (imageId) {
              // Only increment if we haven't seen this image before
              const viewedKey = `viewed_image_${imageId}`
              if (!localStorage.getItem(viewedKey)) {
                incrementScrollCount()
                localStorage.setItem(viewedKey, "true")
              }
            }
          }
        })
      },
      { threshold: 0.5 },
    )

    // Observe all image cards
    const imageCards = document.querySelectorAll(".image-card")
    imageCards.forEach((card) => {
      if (imageObserverRef.current) {
        imageObserverRef.current.observe(card)
      }
    })

    return () => {
      if (imageObserverRef.current) {
        imageObserverRef.current.disconnect()
      }
    }
  }, [results, isSearching, incrementScrollCount])

  // Load initial images
  useEffect(() => {
    if (isInitialLoad) {
      setIsSearching(true)
      fetchBeamImages(1)
        .then(({ images, hasMore, totalCount }) => {
          setResults(images)
          setHasMore(hasMore)
          if (totalCount) {
            setTotalImages(totalCount)
          }
        })
        .catch((error) => {
          console.error("Error loading initial images:", error)
        })
        .finally(() => {
          setIsSearching(false)
          setIsInitialLoad(false)
        })
    }
  }, [isInitialLoad])

  // Handle search
  const handleSearch = async () => {
    setIsSearching(true);
    setPage(1);
    
    try {
      // If query is empty, show all images by using regular fetchBeamImages
      if (!query.trim()) {
        console.log("Search query is empty, showing all images");
        setIsEmbeddingSearch(false);
        const { images, hasMore, totalCount } = await fetchBeamImages(1, 20);
        console.log(`Loaded ${images.length} images`);
        setResults(images);
        setHasMore(hasMore);
        if (totalCount) {
          setTotalImages(totalCount);
        }
      } else {
        // If query is provided, use embedding-based search
        console.log("Performing semantic embedding search for:", query);
        setIsEmbeddingSearch(true);
        const { images, hasMore, totalCount } = await searchImagesByEmbedding(query, 1, 20);
        console.log(`Embedding search found ${images.length} results for "${query}"`);
        setResults(images);
        setHasMore(hasMore);
        if (totalCount) {
          setTotalImages(totalCount);
        }
      }
    } catch (error) {
      console.error("Error with semantic search:", error);
      // Fall back to regular search only if embedding search fails
      try {
        console.log("Falling back to regular search for:", query || "all images");
        setIsEmbeddingSearch(false);
        const { images, hasMore, totalCount } = await fetchBeamImages(1, 20, query);
        console.log(`Regular search found ${images.length} results`);
        setResults(images);
        setHasMore(hasMore);
        if (totalCount) {
          setTotalImages(totalCount);
        }
      } catch (fallbackError) {
        console.error("Error with fallback search:", fallbackError);
      }
    } finally {
      setIsSearching(false);
    }
  }

  // Load more images when scrolling
  const loadMoreImages = useCallback(() => {
    if (isSearching || isScrollLimitReached) return

    const nextPage = page + 1
    const startIndex = (nextPage - 1) * 20

    if (startIndex >= totalImages) {
      setHasMore(false)
      return
    }

    setIsSearching(true)

    // Use the appropriate search method based on current search mode
    if (isEmbeddingSearch && query) {
      // Use embedding search
      searchImagesByEmbedding(query, nextPage, 20)
        .then(({ images, hasMore }) => {
          setResults((prev) => [...prev, ...images])
          setHasMore(hasMore)
          setPage(nextPage)
        })
        .catch((error) => {
          console.error("Error loading more images with embedding search:", error)
        })
        .finally(() => {
          setIsSearching(false)
        })
    } else {
      // Use regular search - pass query only if it has content
      fetchBeamImages(nextPage, 20, query.trim() || undefined)
        .then(({ images, hasMore }) => {
          setResults((prev) => [...prev, ...images])
          setHasMore(hasMore)
          setPage(nextPage)
        })
        .catch((error) => {
          console.error("Error loading more images:", error)
        })
        .finally(() => {
          setIsSearching(false)
        })
    }
  }, [page, isSearching, totalImages, isScrollLimitReached, query, isEmbeddingSearch])

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (isSearching || isScrollLimitReached) return

    if (observer.current) {
      observer.current.disconnect()
    }

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreImages()
        }
      },
      { threshold: 0.5 },
    )

    if (loadingRef.current) {
      observer.current.observe(loadingRef.current)
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [loadMoreImages, isSearching, hasMore, isScrollLimitReached])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedImage) {
        setSelectedImage(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedImage])

  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setSelectedImage(null)
      }
    }

    if (selectedImage) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [selectedImage])

  // Handle image selection with modal view counting
  const handleImageSelect = (image: BeamImage) => {
    // If modal is disabled, do nothing when images are clicked
    if (!MODAL_ENABLED) return

    // Track modal view if not authenticated
    if (!isAuthenticated) {
      // Check if we've already viewed this specific image in modal
      const modalViewedKey = `modal_viewed_${image.id}`
      if (!localStorage.getItem(modalViewedKey)) {
        incrementModalCount()
        localStorage.setItem(modalViewedKey, "true")
      }

      // If we've reached the limit, show auth wall instead of modal
      if (isModalLimitReached) {
        return // Don't set selectedImage, just show auth wall
      }
    }

    // Reset states when opening a new image
    setCopied(false)
    setCopying(false)
    setDownloading(false)

    // Set the selected image to show modal
    setSelectedImage(image)
  }

  // Generate similar images for the modal
  const getSimilarImages = (currentImage: BeamImage) => {
    // In a real app, this would call an API to get visually similar images
    // For now, we'll just get random images from our collection
    return results
      .filter((img) => img.id !== currentImage.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 15)
  }

  // Function to download image
  const handleDownload = async (e: React.MouseEvent, imageUrl: string) => {
    e.stopPropagation()

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

  // Function to copy image to clipboard
  const handleCopy = async (e: React.MouseEvent, imageUrl: string) => {
    e.stopPropagation()

    if (copying || copied) return
    setCopying(true)

    try {
      // For local images in our app, we need to use the full URL
      const absoluteUrl = new URL(imageUrl, window.location.origin).href

      // Fetch the image as a blob
      const response = await fetch(absoluteUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
      }

      const blob = await response.blob()

      // Create a ClipboardItem and write to clipboard
      try {
        const data = [new ClipboardItem({ [blob.type]: blob })]
        await navigator.clipboard.write(data)

        // Show success state
        setCopied(true)
        setTimeout(() => {
          setCopied(false)
        }, 2000)
      } catch (err) {
        console.error("Failed to copy image: ", err)

        // Fallback for browsers that don't support clipboard.write with images
        // Create a temporary link element to download the image
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `image-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        alert("Your browser doesn't support copying images directly. The image has been downloaded instead.")
      }
    } catch (error) {
      console.error("Error copying image to clipboard:", error)
      alert("Unable to copy this image. Please try right-clicking and saving it manually.")
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#6D6E71] grid-bg">
      {/* Navigation Bar */}
      <Navbar />

      <div className="container mx-auto px-4 py-12 pt-20">
        {/* Logo/Header */}
        <div className="mb-8 text-center mt-12">
          <h1 className="text-7xl font-poppins text-[#F0EFE9] tracking-tight font-bold mb-2">find winning ads</h1>
        </div>

        {/* Search input */}
        <div className="flex w-full max-w-xl mx-auto mb-16">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder=""
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                // If the query becomes empty, trigger the search to show all images
                if (e.target.value === '') {
                  handleSearch();
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="pr-10 py-6 border-[#9A9B9D] bg-[#F0EFE9] text-[#333333] focus-visible:ring-[#9A9B9D] font-sans text-lg"
            />
            {/* Show typewriter effect when NOT focused and query is empty */}
            {!isFocused && query === "" && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D6E71] text-lg pointer-events-none">
                <TypewriterEffect phrases={suggestedSearches} typingSpeed={60} deletingSpeed={40} pauseTime={900} />
              </div>
            )}
            {/* Show static placeholder when focused */}
            {isFocused && query === "" && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6D6E71] text-lg pointer-events-none">
                Search for ads...
              </div>
            )}
            <Search 
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6D6E71] cursor-pointer" 
              onClick={handleSearch}
            />
          </div>
        </div>

        {/* Search indicator for embedding search */}
        {query && isEmbeddingSearch && (
          <div className="text-center text-[#F0EFE9] mb-8 font-sans text-xs">
            <span className="bg-[#F0EFE9] text-[#6D6E71] px-2 py-1 rounded-full">AI-powered semantic search</span>
          </div>
        )}

        {/* Empty query indicator */}
        {!query && (
          <div className="text-center text-[#F0EFE9] mb-8 font-sans text-xs">
            <span className="bg-[#F0EFE9] text-[#6D6E71] px-2 py-1 rounded-full">Showing all images</span>
          </div>
        )}

        {/* Results */}
        {isInitialLoad && isSearching ? (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4 space-y-4">
            {Array(12)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="break-inside-avoid mb-4">
                  <Skeleton className="w-full h-[250px] rounded-none bg-[#5A5B5E]" />
                </div>
              ))}
          </div>
        ) : results.length > 0 ? (
          <>
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-4">
              {results.map((image, index) => (
                <ImageCard
                  key={`img-${index}-${image.id}`}
                  image={image}
                  onClick={() => handleImageSelect(image)}
                  onDownload={(e) => handleDownload(e, image.supabase_img_url)}
                  onCopy={(e) => handleCopy(e, image.supabase_img_url)}
                />
              ))}
            </div>

            {/* Loading indicator for infinite scroll */}
            {hasMore && !isScrollLimitReached && (
              <div ref={loadingRef} className="mt-8 flex justify-center">
                {isSearching && !isInitialLoad && (
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F0EFE9] border-t-transparent"></div>
                    <p className="mt-2 text-sm text-[#F0EFE9] font-sans">Loading more ads...</p>
                  </div>
                )}
              </div>
            )}

            {!hasMore && (
              <p className="text-center text-[#F0EFE9] mt-8 mb-12 font-sans">
                You've reached the end of the collection
              </p>
            )}
          </>
        ) : query ? (
          <p className="text-center text-[#F0EFE9] mt-8 font-sans">No results found. Try a different search term.</p>
        ) : null}
      </div>

      {/* Image Modal - Sized to match the image dimensions */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-auto">
          <div
            ref={modalRef}
            className="relative bg-transparent inline-flex items-center justify-center"
            style={{ maxWidth: "95vw", maxHeight: "95vh" }}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 text-[#F0EFE9] hover:text-white z-10 bg-black/50 rounded-full p-1"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Image at natural size */}
            <div className="group relative overflow-hidden">
              <img
                src={selectedImage.supabase_img_url}
                alt={selectedImage.brandName}
                className="max-w-full max-h-full object-contain"
                style={{ 
                  height: `auto`,
                  width: `auto`,
                  maxHeight: `${Math.min(selectedImage.imageHeight || 800, window.innerHeight * 0.9)}px`,
                  maxWidth: `${Math.min(selectedImage.imageWidth || 1200, window.innerWidth * 0.95)}px`,
                }}
              />

              {/* Button container - grouped at bottom right */}
              <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {/* Download button */}
                <button
                  onClick={(e) => handleDownload(e, selectedImage.supabase_img_url)}
                  disabled={downloading}
                  className="bg-[#F0EFE9] text-[#333333] px-4 py-2 rounded-md shadow-md flex items-center hover:bg-white"
                  aria-label="Download image"
                >
                  {downloading ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-[#333333] border-t-transparent animate-spin mr-2"></span>
                      <span className="text-sm font-sans">Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      <span className="text-sm font-sans">Download</span>
                    </>
                  )}
                </button>

                {/* Copy button */}
                <button
                  onClick={(e) => handleCopy(e, selectedImage.supabase_img_url)}
                  disabled={copying || copied}
                  className="bg-[#F0EFE9] text-[#333333] px-4 py-2 rounded-md shadow-md flex items-center hover:bg-white"
                  aria-label="Copy to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      <span className="text-sm font-sans">Copied</span>
                    </>
                  ) : copying ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-[#333333] border-t-transparent animate-spin mr-2"></span>
                      <span className="text-sm font-sans">Copying...</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      <span className="text-sm font-sans">Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Wall - still included but controlled by the AUTH_ENABLED flag */}
      {showAuthWall && <AuthWall onClose={closeAuthWall} onSignup={handleSignup} />}
    </div>
  )
}

// Updated ImageCard component with grouped buttons and using supabase_img_url
function ImageCard({
  image,
  onClick,
  onDownload,
  onCopy,
}: {
  image: BeamImage
  onClick: () => void
  onDownload: (e: React.MouseEvent) => void
  onCopy: (e: React.MouseEvent) => void
}) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  // Handle download with local state
  const handleDownload = (e: React.MouseEvent) => {
    if (isDownloading) return

    setIsDownloading(true)
    onDownload(e)

    // Reset after a short delay
    setTimeout(() => {
      setIsDownloading(false)
    }, 1000)
  }

  // Handle copy with local state
  const handleCopy = (e: React.MouseEvent) => {
    if (isCopying || isCopied) return

    setIsCopying(true)
    onCopy(e)

    // Show success state after a short delay
    setTimeout(() => {
      setIsCopying(false)
      setIsCopied(true)

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false)
      }, 2000)
    }, 500)
  }

  return (
    <div
      className="break-inside-avoid mb-6 overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 group cursor-pointer image-card relative"
      onClick={onClick}
      data-image-id={image.id}
    >
      <div className="relative" style={{ maxHeight: `${image.imageHeight || 600}px` }}>
        <img
          src={image.supabase_img_url}
          alt={image.brandName || "Advertisement image"}
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          style={{ 
            aspectRatio: image.imageWidth && image.imageHeight ? `${image.imageWidth}/${image.imageHeight}` : 'auto' 
          }}
        />
        <div className="absolute inset-0 bg-[#F0EFE9] opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

        {/* Grouped buttons container */}
        <div className="absolute bottom-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-[#F0EFE9] text-[#333333] px-3 py-2 rounded-md shadow-md flex items-center hover:bg-white"
            aria-label="Download image"
          >
            {isDownloading ? (
              <span className="h-4 w-4 rounded-full border-2 border-[#333333] border-t-transparent animate-spin"></span>
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            disabled={isCopying || isCopied}
            className="bg-[#F0EFE9] text-[#333333] px-3 py-2 rounded-md shadow-md flex items-center hover:bg-white"
            aria-label="Copy to clipboard"
          >
            {isCopied ? (
              <Check className="h-4 w-4" />
            ) : isCopying ? (
              <span className="h-4 w-4 rounded-full border-2 border-[#333333] border-t-transparent animate-spin"></span>
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


