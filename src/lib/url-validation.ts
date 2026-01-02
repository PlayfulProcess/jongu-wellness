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
  // Content channels only allow recursive.eco domains
  if (channelSlug === 'kids-stories') {
    return isKidsSafeUrl(url);
  }

  if (channelSlug === 'tarot') {
    return isTarotSafeUrl(url);
  }

  if (channelSlug === 'iching') {
    return isIChingSafeUrl(url);
  }

  // Resource channels allow external URLs
  return { isValid: true };
}

/**
 * Validates if a URL is safe for the kids-stories channel
 * Only allows:
 * - Recursive.eco domains (*.recursive.eco/*, recursive.eco/*)
 */
export function isKidsSafeUrl(url: string): UrlValidationResult {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Allow recursive.eco and all subdomains (including www)
    if (
      hostname === 'recursive.eco' ||
      hostname === 'www.recursive.eco' ||
      hostname.endsWith('.recursive.eco')
    ) {
      return { isValid: true };
    }

    // If none of the patterns match, reject the URL
    return {
      isValid: false,
      error: 'This channel only accepts recursive.eco playlists for child safety.'
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
}

/**
 * Validates if a URL is safe for the tarot channel
 * Only allows recursive.eco and creator.recursive.eco domains
 */
export function isTarotSafeUrl(url: string): UrlValidationResult {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Allow recursive.eco and all subdomains (including creator, www)
    if (
      hostname === 'recursive.eco' ||
      hostname === 'www.recursive.eco' ||
      hostname.endsWith('.recursive.eco')
    ) {
      return { isValid: true };
    }

    // If none of the patterns match, reject the URL
    return {
      isValid: false,
      error: 'This channel only accepts tarot decks from recursive.eco.'
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
}

/**
 * Validates if a URL is safe for the iching channel
 * Only allows recursive.eco and creator.recursive.eco domains
 */
export function isIChingSafeUrl(url: string): UrlValidationResult {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Allow recursive.eco and all subdomains (including creator, www)
    if (
      hostname === 'recursive.eco' ||
      hostname === 'www.recursive.eco' ||
      hostname.endsWith('.recursive.eco')
    ) {
      return { isValid: true };
    }

    // If none of the patterns match, reject the URL
    return {
      isValid: false,
      error: 'This channel only accepts I Ching books from recursive.eco.'
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
    return 'Only recursive.eco playlists are accepted for child safety.';
  }
  if (channelSlug === 'tarot') {
    return 'Only tarot decks from recursive.eco are accepted.';
  }
  if (channelSlug === 'iching') {
    return 'Only I Ching books from recursive.eco are accepted.';
  }
  return null;
}
