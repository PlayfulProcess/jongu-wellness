/**
 * Check if a URL is a Google Drive URL
 */
export function isGoogleDriveUrl(url: string): boolean {
  return url?.includes('drive.google.com') ?? false;
}

/**
 * Get the display URL for images.
 * Uses image proxy for Google Drive URLs to handle CORS.
 */
export function getProxiedImageUrl(url: string): string {
  if (!url) return '';
  // Use proxy for Google Drive URLs
  if (isGoogleDriveUrl(url)) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}
