import { NextRequest, NextResponse } from 'next/server';
import Replicate from "replicate";

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
    
    // Use the Replicate SDK with your custom deployment
    const replicate = new Replicate({
      auth: REPLICATE_API_TOKEN,
    });

    // Create prediction using custom deployment
    let prediction = await replicate.deployments.predictions.create(
      "safwaankay",
      "beam-clip-user-query",
      {
        input: {
          inputs: text
        }
      }
    );
    
    // Wait for prediction to complete
    prediction = await replicate.wait(prediction);
    console.log(`Successfully generated embedding for search`);
    
    // Extract just the embedding array from the prediction output
    // The output format appears to be: [{"embedding": [...], "input": "..."}]
    const predictionOutput = prediction.output;
    let embedding;
    
    if (Array.isArray(predictionOutput) && predictionOutput.length > 0 && predictionOutput[0].embedding) {
      // Extract just the embedding array
      embedding = predictionOutput[0].embedding;
    } else {
      // Fall back to using the raw output if it doesn't match expected format
      embedding = predictionOutput;
    }
    
    // Return the embedding
    return NextResponse.json({ embedding });
    
  } catch (error) {
    console.error('Error generating embedding:', error);
    return NextResponse.json(
      { error: `Failed to generate embedding: ${error}` },
      { status: 500 }
    );
  }
} 