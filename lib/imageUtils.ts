/**
 * Utility functions for optimizing remote image URLs and delivery.
 */

export type ImageSizeVariant = 'tiny' | 'preview' | 'full';

/**
 * Optimizes an image URL for TheSportsDB and other CDNs.
 * TheSportsDB R2 supports /tiny (100x100) and /preview (200x200) for media URLs (badges, cutouts, thumbs).
 *
 * @param url The raw image URL
 * @param targetSize 'tiny' (<= 48px icons), 'preview' (<= 200px banners/cards), or 'full' (original)
 * @returns Optimized image URL string
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  targetSize: ImageSizeVariant = 'tiny'
): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // TheSportsDB R2 media assets (badges, logos, cutouts, player thumbs)
  if (
    (trimmed.includes('thesportsdb.com') || trimmed.includes('r2.thesportsdb.com')) &&
    (trimmed.includes('/media/') || trimmed.includes('/badge/'))
  ) {
    // Strip any existing /preview or /tiny suffix
    const cleanUrl = trimmed.replace(/\/(preview|tiny)$/i, '');

    if (targetSize === 'tiny') {
      return `${cleanUrl}/tiny`;
    }
    if (targetSize === 'preview') {
      return `${cleanUrl}/preview`;
    }
    return cleanUrl;
  }

  return trimmed;
}
