/**
 * Smart Google Review URL Formatter & Resolver
 * Converts ANY Google Maps link (share link, web URL, g.page, etc.)
 * directly into the official 5-star write-review popup URL!
 */

export interface URLResolutionResult {
  originalUrl: string;
  resolvedUrl: string;
  isDirectReview: boolean;
  placeId?: string;
  extractedName?: string;
  detectedType: 'direct_review' | 'short_link' | 'maps_place' | 'hex_ftid' | 'generic_url';
  message: string;
}

/**
 * Converts Google Maps Hex Feature ID (0xLow:0xHigh) to official protobuf Place ID (ChIJ...)
 */
export function hexToPlaceId(hexLow: string, hexHigh: string): string {
  try {
    const cleanLow = hexLow.replace(/^0x/i, '');
    const cleanHigh = hexHigh.replace(/^0x/i, '');
    const low = BigInt('0x' + cleanLow);
    const high = BigInt('0x' + cleanHigh);

    const buf = Buffer.alloc(20);
    buf[0] = 0x0a; // Tag 1 (length-delimited)
    buf[1] = 0x12; // Length 18
    buf[2] = 0x09; // Field 1 (fixed64)
    buf.writeBigUInt64LE(low, 3);
    buf[11] = 0x11; // Field 2 (fixed64)
    buf.writeBigUInt64LE(high, 12);

    return buf.toString('base64url');
  } catch {
    return '';
  }
}

/**
 * Extract Place ID from any string containing 0x...:0x...
 */
export function extractPlaceIdFromHex(text: string): string | null {
  const match = text.match(/0x([0-9a-fA-F]+):0x([0-9a-fA-F]+)/);
  if (match) {
    const placeId = hexToPlaceId(match[1], match[2]);
    if (placeId && placeId.startsWith('ChIJ')) {
      return placeId;
    }
  }
  return null;
}

/**
 * Clean & normalize any incoming URL string
 */
export function cleanUrl(raw: string): string {
  let cleaned = raw.trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  }
  return cleaned;
}

/**
 * Helper to extract readable business name from Google Maps URL
 */
export function extractNameFromMapsUrl(url: string): string | undefined {
  try {
    const match = url.match(/\/maps\/place\/([^/@?]+)/);
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1].replace(/\+/g, ' '));
      // If it contains a comma address, grab the business name part
      return decoded.split(',')[0].trim();
    }
  } catch {
    // ignore
  }
  return undefined;
}

/**
 * Convert known Google links to direct review modal URL
 */
export function formatToReviewUrl(url: string): string {
  const cleaned = cleanUrl(url);

  // 1. If it's already a direct review link with placeid
  if (cleaned.includes('search.google.com/local/writereview')) {
    return cleaned;
  }

  // 2. If it's a g.page link: e.g. https://g.page/r/CW8x... or https://g.page/mybusiness
  if (cleaned.includes('g.page')) {
    if (cleaned.endsWith('/review')) {
      return cleaned;
    }
    return cleaned.replace(/\/+$/, '') + '/review';
  }

  // 3. Extract Place ID directly if already in ChIJ format
  const placeIdMatch = cleaned.match(/ChIJ[A-Za-z0-9_-]{23,}/);
  if (placeIdMatch) {
    const placeId = placeIdMatch[0];
    return `https://search.google.com/local/writereview?placeid=${placeId}`;
  }

  // 4. Extract from hex 0x...:0x... (common in maps URLs)
  const hexPlaceId = extractPlaceIdFromHex(cleaned);
  if (hexPlaceId) {
    return `https://search.google.com/local/writereview?placeid=${hexPlaceId}`;
  }

  return cleaned;
}

/**
 * Server-side resolver for expanding shortlinks and converting directly to write-review dialog
 */
export async function resolveGoogleUrl(inputUrl: string): Promise<URLResolutionResult> {
  const originalUrl = cleanUrl(inputUrl);

  // 1. If already direct review link
  if (
    originalUrl.includes('search.google.com/local/writereview') ||
    (originalUrl.includes('g.page') && originalUrl.endsWith('/review'))
  ) {
    return {
      originalUrl,
      resolvedUrl: originalUrl,
      isDirectReview: true,
      extractedName: extractNameFromMapsUrl(originalUrl) || 'Google Review',
      detectedType: 'direct_review',
      message: 'Link ulasan langsung Google siap.',
    };
  }

  // 2. If g.page link without /review
  if (originalUrl.includes('g.page')) {
    const reviewUrl = originalUrl.replace(/\/+$/, '') + '/review';
    return {
      originalUrl,
      resolvedUrl: reviewUrl,
      isDirectReview: true,
      extractedName: 'Google Review Bisnis',
      detectedType: 'direct_review',
      message: 'Link dikonversi ke form ulasan langsung.',
    };
  }

  // 3. If URL already has hex feature ID (0x...:0x...)
  const directHexPlaceId = extractPlaceIdFromHex(originalUrl);
  if (directHexPlaceId) {
    const resolvedUrl = `https://search.google.com/local/writereview?placeid=${directHexPlaceId}`;
    return {
      originalUrl,
      resolvedUrl,
      isDirectReview: true,
      placeId: directHexPlaceId,
      extractedName: extractNameFromMapsUrl(originalUrl) || 'Google Review',
      detectedType: 'hex_ftid',
      message: 'Place ID berhasil diekstrak dan diubah ke form review.',
    };
  }

  // 4. If URL already has ChIJ Place ID
  const directPlaceIdMatch = originalUrl.match(/ChIJ[A-Za-z0-9_-]{23,}/);
  if (directPlaceIdMatch) {
    const placeId = directPlaceIdMatch[0];
    const resolvedUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
    return {
      originalUrl,
      resolvedUrl,
      isDirectReview: true,
      placeId,
      extractedName: extractNameFromMapsUrl(originalUrl) || 'Google Review',
      detectedType: 'maps_place',
      message: 'Place ID terdeteksi, diarahkan ke form review otomatis.',
    };
  }

  // 5. Shortlink expansion (e.g. maps.app.goo.gl or goo.gl/maps)
  const isShortlink = originalUrl.includes('maps.app.goo.gl') || originalUrl.includes('goo.gl/maps');

  if (isShortlink) {
    try {
      const response = await fetch(originalUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const expandedUrl = response.url || originalUrl;
      const extractedName = extractNameFromMapsUrl(expandedUrl);

      // Check for hex feature ID in expanded URL (e.g. !1s0x...:0x...)
      const hexPlaceId = extractPlaceIdFromHex(expandedUrl);
      if (hexPlaceId) {
        const resolvedUrl = `https://search.google.com/local/writereview?placeid=${hexPlaceId}`;
        return {
          originalUrl,
          resolvedUrl,
          isDirectReview: true,
          placeId: hexPlaceId,
          extractedName: extractedName || 'Google Review',
          detectedType: 'hex_ftid',
          message: 'Shortlink berhasil dikonversi ke pop-up review langsung!',
        };
      }

      // Check for ChIJ Place ID in expanded URL
      const expandedPlaceIdMatch = expandedUrl.match(/ChIJ[A-Za-z0-9_-]{23,}/);
      if (expandedPlaceIdMatch) {
        const placeId = expandedPlaceIdMatch[0];
        const resolvedUrl = `https://search.google.com/local/writereview?placeid=${placeId}`;
        return {
          originalUrl,
          resolvedUrl,
          isDirectReview: true,
          placeId,
          extractedName: extractedName || 'Google Review',
          detectedType: 'short_link',
          message: 'Shortlink berhasil diubah menjadi link review langsung.',
        };
      }

      // Fallback: If we couldn't find place ID, format what we have
      return {
        originalUrl,
        resolvedUrl: expandedUrl,
        isDirectReview: false,
        extractedName: extractedName || 'Google Review',
        detectedType: 'short_link',
        message: 'Link berhasil diperluas.',
      };
    } catch (err) {
      console.error('Error resolving shortlink:', err);
    }
  }

  // Final fallback
  const formatted = formatToReviewUrl(originalUrl);
  return {
    originalUrl,
    resolvedUrl: formatted,
    isDirectReview: formatted.includes('writereview') || formatted.includes('/review'),
    extractedName: extractNameFromMapsUrl(originalUrl) || 'Google Review',
    detectedType: 'generic_url',
    message: 'Link diproses.',
  };
}
