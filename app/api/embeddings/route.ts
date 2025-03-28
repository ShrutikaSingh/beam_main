import { NextRequest, NextResponse } from 'next/server';

// Handler for POST requests to /api/embeddings
export async function POST(request: NextRequest) {
  try {
    // Get the text from the request body
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text parameter is required and must be a string' },
        { status: 400 }
      );
    }
    
    // Get the Replicate API token from environment variables
    const REPLICATE_API_TOKEN = process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN;
    
    if (!REPLICATE_API_TOKEN) {
      console.error('Replicate API token is missing');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API token' },
        { status: 500 }
      );
    }
    
    console.log(`Generating embedding for text: "${text}"`);
    
    // Step 1: Start the prediction
    const startResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "1c0371070cb827ec3c7f2f28adcdde54b50dcd239aa6faea0bc98b174ef03fb4",
        input: {
          text: text
        }
      })
    });
    
    if (!startResponse.ok) {
      const errorData = await startResponse.text();
      console.error('Replicate API error:', errorData);
      return NextResponse.json(
        { error: `Replicate API error: ${startResponse.statusText}` },
        { status: startResponse.status }
      );
    }
    
    const prediction = await startResponse.json();
    const predictionId = prediction.id;
    
    console.log(`Started prediction with ID: ${predictionId}`);
    
    // Step 2: Poll for completion
    const embedding = await waitForEmbedding(predictionId, REPLICATE_API_TOKEN);
    
    // Return the embedding
    return NextResponse.json({ embedding });
    
  } catch (error) {
    console.error('Error generating embedding:', error);
    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    );
  }
}

// Helper function to wait for embedding generation
async function waitForEmbedding(predictionId: string, apiToken: string) {
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to check prediction: ${response.statusText}`);
      }
      
      const prediction = await response.json();
      
      if (prediction.status === 'succeeded') {
        const embedding = prediction.output.embedding;
        
        if (!Array.isArray(embedding) || embedding.length !== 768) {
          throw new Error(`Invalid embedding format or dimension: got ${embedding?.length || 0} dimensions`);
        }
        
        return embedding;
      } else if (prediction.status === 'failed') {
        throw new Error(`Embedding generation failed: ${prediction.error}`);
      }
      
      // Still processing, wait and try again
      console.log(`Waiting for embedding... Status: ${prediction.status}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    } catch (error) {
      console.error('Error checking prediction status:', error);
      throw error;
    }
  }
  
  throw new Error('Embedding generation timed out');
} 