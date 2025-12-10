/**
 * URL validation utilities for channel-specific restrictions
 */

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Checks if a URL is allowed for a specific channel
 */
export function isAllowedUrlForChannel(url: string, channelSlug: string): UrlValidationResult {
  // Only apply restrictions to kids-stories channel
  if (channelSlug !== 'kids-stories') {
    return { isValid: true };
  }

  // For kids-stories, only allow Google Drive and recursive.eco domains
  return isKidsSafeUrl(url);
}

/**
 * Validates if a URL is safe for the kids-stories channel
 * Only allows:
 * - Google Drive files (drive.google.com/file/d/*, drive.google.com/open?id=*)
 * - Google Docs (docs.google.com/document/d/*, docs.google.com/presentation/d/*)
 * - Recursive.eco domains (*.recursive.eco/*, recursive.eco/*)
 */
export function isKidsSafeUrl(url: string): UrlValidationResult {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname;

    // Allow Google Drive file links
    if (hostname === 'drive.google.com') {
      if (pathname.startsWith('/file/d/') || pathname.startsWith('/open')) {
        return { isValid: true };
      }
    }

    // Allow Google Docs and Presentations
    if (hostname === 'docs.google.com') {
      if (pathname.startsWith('/document/d/') || pathname.startsWith('/presentation/d/')) {
        return { isValid: true };
      }
    }

    // Allow recursive.eco and all subdomains
    if (hostname === 'recursive.eco' || hostname.endsWith('.recursive.eco')) {
      return { isValid: true };
    }

    // If none of the patterns match, reject the URL
    return {
      isValid: false,
      error: 'This channel only accepts Google Drive files and recursive.eco playlists for child safety.'
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
}

/**
 * Get allowed domains message for a channel
 */
export function getAllowedDomainsMessage(channelSlug: string): string | null {
  if (channelSlug === 'kids-stories') {
    return 'Only Google Drive files and recursive.eco playlists are accepted for child safety.';
  }
  return null;
}
