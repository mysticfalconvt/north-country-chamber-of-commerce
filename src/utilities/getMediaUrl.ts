import { getClientSideURL } from '@/utilities/getURL'
import type { Media } from '@/payload-types'

// Available image sizes from Media collection config
export type ImageSize = 'thumbnail' | 'square' | 'small' | 'medium' | 'large' | 'xlarge' | 'og'

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  // Check if URL already has http/https protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return cacheTag ? `${url}?${cacheTag}` : url
  }

  // Otherwise prepend client-side URL
  const baseUrl = getClientSideURL()
  return cacheTag ? `${baseUrl}${url}?${cacheTag}` : `${baseUrl}${url}`
}

/**
 * Get the URL for an optimized image size from a Payload Media object
 * Falls back to the original URL if the requested size doesn't exist
 *
 * @param media The Payload Media object (or null/undefined)
 * @param size The desired image size
 * @param cacheTag Optional cache tag to append to the URL
 * @returns The optimized image URL or empty string if no media
 *
 * @example
 * // For card thumbnails (300px)
 * getOptimizedImageUrl(newsItem.image, 'thumbnail')
 *
 * // For cards in a grid (900px)
 * getOptimizedImageUrl(newsItem.image, 'medium')
 *
 * // For hero images (1400px)
 * getOptimizedImageUrl(event.image, 'large')
 *
 * // For full-width banners (1920px)
 * getOptimizedImageUrl(page.hero, 'xlarge')
 */
export const getOptimizedImageUrl = (
  media: Media | string | number | null | undefined,
  size: ImageSize = 'medium',
  cacheTag?: string | null,
): string => {
  // Handle null, undefined, or ID-only references
  if (!media || typeof media === 'string' || typeof media === 'number') {
    return ''
  }

  // Try to get the requested size
  const sizeUrl = media.sizes?.[size]?.url

  // Fall back to original URL if size doesn't exist
  const url = sizeUrl || media.url

  return getMediaUrl(url, cacheTag)
}
