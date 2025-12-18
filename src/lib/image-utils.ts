/**
 * Check if a URL is a Google Drive URL
 */
export function isGoogleDriveUrl(url: string): boolean {
  return url?.includes('drive.google.com') ?? false;
}

/**
 * Get the display URL for images.
 *
 * - Google Drive URLs: Proxied via /api/image-proxy (required due to CORS)
 * - YouTube URLs (img.youtube.com): Pass through directly (public, no CORS issues)
 * - Other URLs: Pass through directly
 */
export function getProxiedImageUrl(url: string): string {
  if (!url) return '';
  // Only proxy Google Drive URLs - YouTube and other public image hosts work directly
  if (isGoogleDriveUrl(url)) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}
