import { createClientSupabaseClient } from './supabase'

export interface BeamImage {
  id: number
  created_at: string
  original_id: number
  imageUrl: string
  imageHeight: number
  imageWidth: number
  brandId: string
  brandName: string
  brandImage: string
  performanceRating: number
  priority: number
  industry: string
  cursorIndex: number
  supabase_img_url: string
  template_vector: any[]
}

/**
 * Fetch images from the beam_images table
 * @param page Page number to fetch (1-indexed)
 * @param perPage Number of images per page
 * @param searchQuery Optional search query to filter images
 * @returns Array of images and metadata
 */
export async function fetchBeamImages(page: number = 1, perPage: number = 20, searchQuery?: string) {
  const supabase = createClientSupabaseClient()
  
  // Calculate offset based on page number
  const offset = (page - 1) * perPage

  // Start building the query
  let query = supabase
  .from('beam_images')
  .select('*')
  .not('supabase_img_url', 'is', null)
  .limit(perPage)


  // Add search/filter if provided
  if (searchQuery && searchQuery.trim() !== '') {
    // You could implement more sophisticated searching here
    // This is a simple example that searches in the brandName and industry fields
    query = query.or(`brandName.ilike.%${searchQuery}%,industry.ilike.%${searchQuery}%`)
  }

  // Complete the query with pagination
  const { data, error, count } = await query
    .order('priority', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (error) {
    console.error('Error fetching beam images:', error)
    throw new Error(`Failed to fetch images: ${error.message}`)
  }

  return {
    images: data as BeamImage[],
    hasMore: data.length === perPage,
    totalCount: count
  }
} 