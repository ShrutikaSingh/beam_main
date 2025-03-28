import { createClientSupabaseClient } from './supabase'
import { transformImageUrl } from '@/lib/utils'

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
  .select(`
    *,
    beam_embeddings!inner (
      image_id
    )
  `)
  .not('supabase_img_url', 'is', null)
  .neq('supabase_img_url', '')
  .limit(perPage)

  // Add search/filter if provided
  if (searchQuery && searchQuery.trim() !== '') {
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
  
  // Transform the URLs to use the new domain
  const transformedData = data.map(image => ({
    ...image,
    supabase_img_url: transformImageUrl(image.supabase_img_url)
  }));

  return {
    images: transformedData as BeamImage[],
    hasMore: data.length === perPage,
    totalCount: count
  }
}

/**
 * Generate text embedding using our API route (which calls Replicate)
 * @param text The text to generate an embedding for
 * @returns A 768-dimensional embedding vector
 */
export async function generateTextEmbedding(text: string) {
  try {
    console.log(`Generating embedding for text: "${text}" via API route`);
    
    // Use our API route to avoid CORS issues
    const response = await fetch('/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error:", errorText);
      throw new Error(`Failed to generate embedding: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embedding;
  } catch (error) {
    console.error('Error generating text embedding:', error);
    throw error;
  }
}

/**
 * Define interface for embedding matches
 */
interface EmbeddingMatch {
  id: string;
  image_id: number;
  similarity: number;
  beam_image_url?: string;
}

/**
 * Search for images using a text query via embeddings
 * @param textQuery The text query to search for
 * @param page Page number (1-indexed)
 * @param perPage Number of results per page
 * @returns Matching images and metadata
 */
export async function searchImagesByEmbedding(textQuery: string, page: number = 1, perPage: number = 20) {
  try {
    console.log(`Starting embedding search for "${textQuery}" via API route`);
    
    // Use the API route to search with embeddings
    const response = await fetch(`/api/search?q=${encodeURIComponent(textQuery)}&page=${page}&perPage=${perPage}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Search API error:", errorText);
      throw new Error(`Failed to search: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`API returned ${result.images?.length || 0} images for query "${textQuery}"`);
    
    return {
      images: result.images as BeamImage[],
      hasMore: result.hasMore,
      totalCount: result.totalCount
    };
  } catch (error) {
    console.error('Error in searchImagesByEmbedding:', error);
    throw error;
  }
} 