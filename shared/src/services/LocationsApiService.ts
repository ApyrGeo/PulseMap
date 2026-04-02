import { getApiUrl } from '../config/environment';
import { TokenService } from './TokenService';
import {
  Location,
  LocationPostDTO,
  LocationPutDTO,
  LocationLikesSummaryDTO,
  LocationRecommendationDTO,
  MapBounds,
} from '../types/location';

async function getAuthHeaders(tokenService: TokenService): Promise<Record<string, string>> {
  return tokenService.getAuthHeader();
}

export async function fetchLocations(
  tokenService: TokenService,
  active: boolean,
  userId?: number
): Promise<Location[]> {
  const params = new URLSearchParams({ active: active.toString() });
  if (userId) params.append('userId', userId.toString());

  const response = await fetch(`${getApiUrl()}/Location?${params}`, {
    headers: await getAuthHeaders(tokenService),
  });
  if (!response.ok) throw new Error('Failed to fetch locations');
  return response.json();
}

export async function fetchLocationsByBounds(
  tokenService: TokenService,
  bounds: MapBounds,
  active: boolean,
  userId?: number
): Promise<Location[]> {
  const params = new URLSearchParams({
    minLat: bounds.minLat.toString(),
    maxLat: bounds.maxLat.toString(),
    minLng: bounds.minLng.toString(),
    maxLng: bounds.maxLng.toString(),
    active: active.toString(),
  });
  if (userId) params.append('userId', userId.toString());

  const response = await fetch(`${getApiUrl()}/Location/bounds?${params}`, {
    headers: await getAuthHeaders(tokenService),
  });
  if (!response.ok) throw new Error('Failed to fetch locations by bounds');
  return response.json();
}

export async function fetchRecommendedLocationsByBounds(
  tokenService: TokenService,
  bounds: MapBounds,
  userId: number,
  count = 8
): Promise<LocationRecommendationDTO[]> {
  const params = new URLSearchParams({
    minLat: bounds.minLat.toString(),
    maxLat: bounds.maxLat.toString(),
    minLng: bounds.minLng.toString(),
    maxLng: bounds.maxLng.toString(),
    userId: userId.toString(),
    count: count.toString(),
  });

  const response = await fetch(`${getApiUrl()}/Location/recommendations/bounds?${params}`, {
    headers: await getAuthHeaders(tokenService),
  });
  if (!response.ok) throw new Error('Failed to fetch recommendations');
  return response.json();
}

export async function createLocation(
  tokenService: TokenService,
  dto: LocationPostDTO
): Promise<Location> {
  const response = await fetch(`${getApiUrl()}/Location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeaders(tokenService)),
    },
    body: JSON.stringify(dto),
  });
  if (!response.ok) throw new Error('Failed to create location');
  return response.json();
}

export async function updateLocation(
  tokenService: TokenService,
  id: number,
  data: LocationPutDTO
): Promise<Location> {
  const response = await fetch(`${getApiUrl()}/Location/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeaders(tokenService)),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update location');
  return response.json();
}

export async function deleteLocation(tokenService: TokenService, id: number): Promise<void> {
  const response = await fetch(`${getApiUrl()}/Location/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders(tokenService),
  });
  if (!response.ok) throw new Error('Failed to delete location');
}

export async function expireLocation(tokenService: TokenService, id: number): Promise<Location> {
  const response = await fetch(`${getApiUrl()}/Location/${id}/expire`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeaders(tokenService)),
    },
  });
  if (!response.ok) throw new Error('Failed to expire location');
  return response.json();
}

export async function extendLocation(tokenService: TokenService, id: number): Promise<Location> {
  const response = await fetch(`${getApiUrl()}/Location/${id}/extend`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeaders(tokenService)),
    },
  });
  if (!response.ok) throw new Error('Failed to extend location');
  return response.json();
}

export interface ImageUploadInput {
  uri: string;
  name: string;
  type: string;
  webFile?: unknown; // web-only: the actual File object
}

export async function uploadImages(
  tokenService: TokenService,
  images: ImageUploadInput[]
): Promise<string[]> {
  const formData = new FormData();
  images.forEach((img) => {
    if (img.webFile) {
      formData.append('images', img.webFile as Blob);
    } else {
      formData.append('images', { uri: img.uri, name: img.name, type: img.type } as unknown as Blob);
    }
  });
  const response = await fetch(`${getApiUrl()}/image/upload`, {
    method: 'POST',
    headers: await tokenService.getAuthHeader(),
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to upload images');
  const filenames: string[] = await response.json();
  return filenames.map((f) => `${getApiUrl()}/image/${f}`);
}

export async function confirmLocationEvent(tokenService: TokenService, id: number): Promise<Location> {
  const response = await fetch(`${getApiUrl()}/Location/${id}/confirm-event`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeaders(tokenService)),
    },
  });
  if (!response.ok) throw new Error('Failed to confirm event');
  return response.json();
}

export async function rejectLocationEvent(tokenService: TokenService, id: number): Promise<Location> {
  const response = await fetch(`${getApiUrl()}/Location/${id}/reject-event`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeaders(tokenService)),
    },
  });
  if (!response.ok) throw new Error('Failed to reject event');
  return response.json();
}

export async function classifyLocation(
  tokenService: TokenService,
  description: string
): Promise<string[]> {
  try {
    const response = await fetch(`${getApiUrl()}/AI/classify-location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await tokenService.getAuthHeader()),
      },
      body: JSON.stringify({ description }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : (data?.categories ?? []);
  } catch {
    return [];
  }
}

export async function likeLocationAPI(
  tokenService: TokenService,
  locationId: number,
  userId: number
): Promise<LocationLikesSummaryDTO> {
  const response = await fetch(`${getApiUrl()}/Location/${locationId}/like?userId=${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(await getAuthHeaders(tokenService)),
    },
  });
  if (!response.ok) throw new Error('Failed to toggle like');
  const location = await response.json();
  return {
    id: location.id,
    likesCount: location.likesCount,
    isNowLiked: location.isLikedByCurrentUser,
    toggledByUserId: userId,
  };
}
