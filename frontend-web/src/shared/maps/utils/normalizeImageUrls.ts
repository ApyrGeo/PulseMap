import { BASE_API_URL } from '../../../core';
import { Location } from '../Interfaces';

/**
 * Normalizes image URLs in a location to use the current environment's API URL.
 * This handles cases where locations were created with localhost URLs but are being
 * viewed in production, or vice versa.
 *
 * @param location The location with potentially outdated image URLs
 * @returns A new location object with normalized image URLs
 */
export function normalizeLocationImageUrls(location: Location): Location {
  if (!location.imageUrls || location.imageUrls.length === 0) {
    return location;
  }

  const normalizedImageUrls = location.imageUrls.map((url) => {
    // Match URLs in the format: https://localhost:7215/api/image/filename
    // or https://[production-domain]/api/image/filename
    const imagePathMatch = url.match(/\/api\/image\/(.+)$/);

    if (imagePathMatch) {
      const filename = imagePathMatch[1];
      // Reconstruct URL with current environment's BASE_API_URL
      return `${BASE_API_URL}/image/${filename}`;
    }

    // If URL doesn't match expected pattern, return as-is
    return url;
  });

  return {
    ...location,
    imageUrls: normalizedImageUrls,
  };
}

/**
 * Normalizes image URLs for an array of locations
 */
export function normalizeLocationsImageUrls(
  locations: Location[]
): Location[] {
  return locations.map(normalizeLocationImageUrls);
}
