/**
 * Helpers for building Cloudinary delivery URLs from a `secure_url` or
 * `public_id` stored on the backend.
 *
 * Cloudinary URLs look like:
 *   https://res.cloudinary.com/<cloud>/image/upload/v123/<publicId>.<ext>
 * We can inject transformations between `/upload/` and the version segment
 * (e.g. `/upload/w_800,c_fill,q_auto,f_auto/v123/<publicId>.<ext>`).
 */

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  /** Cloudinary crop mode. Defaults to `fill` to keep aspect ratio. */
  crop?: 'fill' | 'fit' | 'thumb' | 'scale' | 'limit';
  /** Quality. Defaults to `auto:good`. */
  quality?: string;
  /** Format. Defaults to `auto` (modern WebP/AVIF when supported). */
  format?: string;
}

const DEFAULT_OPTS: Required<ImageTransformOptions> = {
  width: 0,
  height: 0,
  crop: 'fill',
  quality: 'auto:good',
  format: 'auto',
};

/**
 * Apply Cloudinary transformations to a delivery URL. If the URL is not a
 * Cloudinary URL the original string is returned unchanged.
 */
export function transformCloudinary(
  url: string | null | undefined,
  opts: ImageTransformOptions,
): string | null {
  if (!url) return null;
  if (!url.includes('res.cloudinary.com')) return url;

  const o = { ...DEFAULT_OPTS, ...opts };
  const parts: string[] = [];
  if (o.width) parts.push(`w_${o.width}`);
  if (o.height) parts.push(`h_${o.height}`);
  if (o.crop) parts.push(`c_${o.crop}`);
  if (o.quality) parts.push(`q_${o.quality}`);
  if (o.format) parts.push(`f_${o.format}`);
  const tx = parts.join(',');

  return url.replace('/upload/', `/upload/${tx}/`);
}
