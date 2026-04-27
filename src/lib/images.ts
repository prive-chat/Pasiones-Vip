/**
 * Utility for Supabase Image Transformations
 * Allows resizing and optimizing images on the fly.
 */

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_URL?.split('//')[1]?.split('.')[0];

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'origin';
  resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Generates a Supabase transformation URL for an image.
 * Note: This requires the Supabase project to have image transformation enabled (Pro plan or higher).
 * If VITE_ENABLE_IMAGE_TRANSFORMATION is not 'true', it returns the original public URL.
 */
export function getOptimizedImageUrl(url: string | undefined, options: ImageTransformOptions = {}) {
  if (!url) return '';
  
  // Only handle Supabase storage URLs
  if (!url.includes('.supabase.co/storage/v1/object/public/')) {
    return url;
  }

  // Check if transformation is explicitly enabled
  const isTransformationEnabled = import.meta.env.VITE_ENABLE_IMAGE_TRANSFORMATION === 'true';
  
  if (!isTransformationEnabled) {
    return url;
  }

  const { width, height, quality = 80, format = 'webp', resize = 'cover' } = options;
  
  // Construct transformation params
  const params = new URLSearchParams();
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  params.append('quality', quality.toString());
  params.append('format', format);
  params.append('resize', resize);

  // Supabase Image Transformation URL format:
  // [project-url]/storage/v1/render/image/public/[bucket]/[path]?[params]
  
  const renderPath = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  return `${renderPath}?${params.toString()}`;
}

/**
 * Predefined sizes for common UI elements
 */
export const IMAGE_SIZES = {
  AVATAR_SM: { width: 40, height: 40 },
  AVATAR_MD: { width: 80, height: 80 },
  AVATAR_LG: { width: 160, height: 160 },
  THUMBNAIL: { width: 300, height: 300 },
  FEED_POST: { width: 800 },
  COVER: { width: 1200, height: 400 }
};
