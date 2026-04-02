import { getApiUrl } from '../config/environment';
import { TokenService } from './TokenService';
import { MapBounds } from '../types/location';

export interface EventResponseDTO {
  id: number;
  name: string;
  isAIGenerated: boolean;
  requiresReview: boolean;
  confidenceScore: number;
  latitude: number;
  longitude: number;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
  locationsCount: number;
}

export async function fetchEventsByBounds(
  tokenService: TokenService,
  bounds: MapBounds,
  active = true
): Promise<EventResponseDTO[]> {
  const params = new URLSearchParams({
    minLat: bounds.minLat.toString(),
    maxLat: bounds.maxLat.toString(),
    minLng: bounds.minLng.toString(),
    maxLng: bounds.maxLng.toString(),
    active: active.toString(),
  });
  const response = await fetch(`${getApiUrl()}/Event/bounds?${params}`, {
    headers: await tokenService.getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch events by bounds');
  return response.json();
}
