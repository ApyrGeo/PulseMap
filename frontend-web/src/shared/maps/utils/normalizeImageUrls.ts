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

    const imagePathMatch = url.match(/\/api\/image\/(.+)$/);

    if (imagePathMatch) {
      const filename = imagePathMatch[1];
      return `${BASE_API_URL}/image/${filename}`;
    }

    return url;
  });

  return {
    ...location,
    imageUrls: normalizedImageUrls,
  };
}


export function normalizeLocationsImageUrls(
  locations: Location[]
): Location[] {
  return locations.map(normalizeLocationImageUrls);
}
