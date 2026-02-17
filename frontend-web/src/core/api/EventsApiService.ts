import { BASE_API_URL } from '../index';
import { Location } from '../../locations/Interfaces';

const EVENTS_URL = BASE_API_URL + '/Event';

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

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
  locations?: Location[];
}

export interface EventClusteringResultDTO {
  eventsCreated: number;
  locationsProcessed: number;
  events: EventResponseDTO[];
}

/**
 * GET /api/event/{id}
 * Obține un eveniment după ID
 */
export const fetchEventById = async (
  id: number,
  includeLocations: boolean = false
): Promise<EventResponseDTO> => {
  const params = new URLSearchParams();
  if (includeLocations) {
    params.append('includeLocations', 'true');
  }

  const url = `${EVENTS_URL}/${id}${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch event');
  }

  return await response.json();
};

/**
 * GET /api/event
 * Obține toate evenimentele
 */
export const fetchEvents = async (active: boolean = true): Promise<EventResponseDTO[]> => {
  const params = new URLSearchParams({ active: active.toString() });
  const response = await fetch(`${EVENTS_URL}?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }

  return await response.json();
};

/**
 * GET /api/event/bounds
 * Obține evenimente în bounds geografic
 */
export const fetchEventsByBounds = async (
  bounds: MapBounds,
  active: boolean = true,
  includeLocations: boolean = true
): Promise<EventResponseDTO[]> => {
  const params = new URLSearchParams({
    minLat: bounds.minLat.toString(),
    maxLat: bounds.maxLat.toString(),
    minLng: bounds.minLng.toString(),
    maxLng: bounds.maxLng.toString(),
    active: active.toString(),
  });

  if (includeLocations) {
    params.append('includeLocations', 'true');
  }

  const response = await fetch(`${EVENTS_URL}/bounds?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch events by bounds');
  }

  return await response.json();
};

/**
 * POST /api/event/analyze
 * Analizează și clusterizează locațiile în evenimente
 */
export const analyzeAndClusterEvents = async (
  maxDistance: number = 100
): Promise<EventClusteringResultDTO> => {
  const params = new URLSearchParams({ maxDistance: maxDistance.toString() });
  const response = await fetch(`${EVENTS_URL}/analyze?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to analyze and cluster events');
  }

  return await response.json();
};

/**
 * PATCH /api/event/{id}/confirm
 * Confirmă un eveniment care necesită review
 */
export const confirmEvent = async (id: number): Promise<EventResponseDTO> => {
  const response = await fetch(`${EVENTS_URL}/${id}/confirm`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to confirm event');
  }

  return await response.json();
};

/**
 * DELETE /api/event/{id}
 * Șterge un eveniment
 */
export const deleteEvent = async (id: number): Promise<void> => {
  const response = await fetch(`${EVENTS_URL}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete event');
  }
};
