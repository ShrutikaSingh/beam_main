import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Transforms image URLs from the old domain to the new one
 */
export function transformImageUrl(url: string): string {
  if (!url) return url;
  
  // Replace old domain with new one
  if (url.includes('auth.ravahq.com')) {
    return url.replace('auth.ravahq.com', 'auth.beam.new');
  }
  
  // Handle relative URLs by adding the new domain
  if (url.startsWith('abcs') || !url.startsWith('http')) {
    return `https://auth.beam.new/storage/v1/object/beamdata/${url}`;
  }
  
  return url;
}
