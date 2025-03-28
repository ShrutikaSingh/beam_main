# Beam - AI-Powered Image Search

A Next.js application for discovering and exploring images with advanced AI-powered search functionality.

## Features

- Browse and search through a collection of high-quality images
- AI-powered semantic search using CLIP embeddings
- Image download and copy to clipboard
- Responsive masonry layout
- Infinite scroll loading
- Image modal with natural sizing

## How It Works

### Image Search

The application offers two types of search:

1. **Standard Search**: Searches images based on text matches in the database fields like `brandName` and `industry`.

2. **AI-Powered Semantic Search**: Uses CLIP embeddings to find images that are semantically similar to your search query, even if they don't contain the exact keywords. This allows you to search by concepts, styles, emotions, and more.

### Embedding-Based Search Technical Details

The image search uses a vector database approach:

1. Images are pre-processed with a CLIP model to generate 768-dimensional embeddings that represent the visual content.
2. These embeddings are stored in the `beam_embeddings` table.
3. When you search with text, the same CLIP model generates a text embedding.
4. The system finds images with similar embeddings using cosine similarity.
5. Results are ranked by similarity score.

## Environment Setup

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_REPLICATE_API_TOKEN=your_replicate_api_token
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses two main tables:

### beam_images

Stores the actual image information:

- `id`: Unique identifier
- `supabase_img_url`: URL to the image stored in Supabase storage
- `imageHeight`: Height of the image in pixels
- `imageWidth`: Width of the image in pixels
- `brandName`: Name of the brand associated with the image
- `industry`: Industry category
- Various other metadata fields

### beam_embeddings

Stores the vector embeddings for semantic search:

- `id`: Unique identifier (UUID)
- `image_id`: Foreign key to beam_images.id
- `embedding`: Vector representation of the image (768 dimensions)
- `beam_image_url`: Duplicate of the image URL for convenience

## Search API

The application provides two main search functions:

```typescript
// Standard text search
fetchBeamImages(page, perPage, searchQuery)

// Embedding-based semantic search
searchImagesByEmbedding(textQuery, page, perPage)
``` 