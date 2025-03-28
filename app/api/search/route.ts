import { NextRequest, NextResponse } from 'next/server';
import { createClientSupabaseClient } from '@/lib/supabase';

// Define interface for embedding matches
interface EmbeddingMatch {
  id: string;
  image_id: number;
  similarity: number;
  beam_image_url?: string;
}

// Handler for GET requests to /api/search
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }
    
    console.log(`Processing search for query: "${query}"`);
    
   
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

    // Step 1: Generate text embedding via our API
    const embeddingResponse = await fetch(`${baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: query }),
      });
      
    if (!embeddingResponse.ok) {
      console.error('Error generating embedding:', await embeddingResponse.text());
      return NextResponse.json(
        { error: 'Failed to generate embedding for search' },
        { status: 500 }
      );
    }
    
    const { embedding } = await embeddingResponse.json();
    console.log('Successfully generated embedding for search');
    
    // Ensure embedding is properly formatted as an array
    let formattedEmbedding;
    if (typeof embedding === 'string') {
      try {
        // Try to parse if it's a JSON string
        formattedEmbedding = JSON.parse(embedding);
      } catch (e) {
        console.error('Error parsing embedding string:', e);
        return NextResponse.json(
          { error: 'Invalid embedding format' },
          { status: 500 }
        );
      }
    } else if (embedding && typeof embedding === 'object') {
      // If it's already an object with embedding property, extract it
      if (Array.isArray(embedding) && embedding.length > 0 && embedding[0]?.embedding) {
        formattedEmbedding = embedding[0].embedding;
      } else {
        // Otherwise use as is if it's already an array
        formattedEmbedding = embedding;
      }
    }
    
    // Validate that we have a proper array
    if (!Array.isArray(formattedEmbedding)) {
      console.error('Invalid embedding format, expected array but got:', typeof formattedEmbedding);
      return NextResponse.json(
        { error: 'Invalid embedding format, expected array' },
        { status: 500 }
      );
    }
    
    // Step 2: Initialize Supabase client
    const supabase = createClientSupabaseClient();
    
    // Step 3: Find matching image IDs using cosine similarity search
    const { data: embeddingMatches, error: embeddingError } = await supabase.rpc('match_embeddings_by_vector', {
      query_embedding: formattedEmbedding,
      match_threshold: 0.2, // Lower threshold for more results
      match_count: 100 // Get more than needed for pagination
    });
    
    if (embeddingError) {
      console.error('Error searching embeddings:', embeddingError);
      return NextResponse.json(
        { error: `Failed to search embeddings: ${embeddingError.message}` },
        { status: 500 }
      );
    }
    
    console.log(`Found ${embeddingMatches?.length || 0} embedding matches`);
    
    // If no matches, return empty results
    if (!embeddingMatches || embeddingMatches.length === 0) {
      return NextResponse.json({
        images: [],
        hasMore: false,
        totalCount: 0
      });
    }
    
    // Extract image IDs from matches
    const imageIds = embeddingMatches.map((match: EmbeddingMatch) => match.image_id);
    
    // Calculate pagination
    const offset = (page - 1) * perPage;
    const limit = perPage;
    
    // Get the images from beam_images using the matched IDs
    const { data: images, error: imagesError } = await supabase
      .from('beam_images')
      .select('*')
      .in('id', imageIds)
      .order('priority', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (imagesError) {
      console.error('Error fetching images:', imagesError);
      return NextResponse.json(
        { error: `Failed to fetch images: ${imagesError.message}` },
        { status: 500 }
      );
    }
    
    console.log(`Retrieved ${images?.length || 0} images for page ${page}`);
    
    // Return the results
    return NextResponse.json({
      images: images,
      hasMore: imageIds.length > offset + limit,
      totalCount: imageIds.length
    });
    
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Failed to process search' },
      { status: 500 }
    );
  }
} 