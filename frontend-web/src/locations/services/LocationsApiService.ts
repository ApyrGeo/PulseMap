import { BASE_API_URL } from '../../core';
import {
  LocationLikesSummaryDTO,
  LocationPostDTO,
  LocationPutDTO,
} from '../Interfaces';
import { Location } from '../Interfaces';

const LOCATIONS_URL = BASE_API_URL + '/Location';

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export async function fetchLocations(active: boolean): Promise<Location[]> {
  const response = await fetch(`${LOCATIONS_URL}?active=${active}`);
  if (!response.ok) {
    throw new Error('Failed to fetch locations');
  }
  return response.json();
}

export async function fetchLocationsByBounds(
  bounds: MapBounds,
  active: boolean,
  type?: string | null
): Promise<Location[]> {
  const params = new URLSearchParams({
    minLat: bounds.minLat.toString(),
    maxLat: bounds.maxLat.toString(),
    minLng: bounds.minLng.toString(),
    maxLng: bounds.maxLng.toString(),
    active: active.toString(),
  });

  if (type) {
    params.append('type', type);
  }

  const response = await fetch(`${LOCATIONS_URL}/bounds?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch locations by bounds');
  }
  return response.json();
}

export async function createLocation(dto: LocationPostDTO): Promise<Location> {
  const response = await fetch(`${LOCATIONS_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create location:', errorText);
    throw new Error('Failed to create location');
  }

  const newLocation = await response.json();
  return newLocation;
}

export async function updateLocation(
  id: number,
  data: LocationPutDTO
): Promise<Location> {
  const response = await fetch(`${LOCATIONS_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to update location:', errorText);
    throw new Error('Failed to update location');
  }

  return response.json();
}

export async function deleteLocation(id: number): Promise<void> {
  const response = await fetch(`${LOCATIONS_URL}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to delete location:', errorText);
    throw new Error('Failed to delete location');
  }
}

export async function expireLocation(id: number): Promise<Location> {
  const response = await fetch(`${LOCATIONS_URL}/${id}/expire`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to expire location:', errorText);
    throw new Error('Failed to expire location');
  }

  return response.json();
}

export async function extendLocation(id: number): Promise<Location> {
  const response = await fetch(`${LOCATIONS_URL}/${id}/extend`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to extend location:', errorText);
    throw new Error('Failed to extend location');
  }

  return response.json();
}

export async function likeLocationAPI(
  locationId: number,
  userId: number
): Promise<LocationLikesSummaryDTO> {
  const response = await fetch(
    `${LOCATIONS_URL}/${locationId}/like?userId=${userId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  if (!response.ok) {
    const txt = await response.text();
    console.error('Failed to like location:', txt);
    throw new Error('Failed to like location');
  }
  const location = await response.json();
  return {
    id: location.id,
    likesCount: location.likesCount,
    isNowLiked: location.isLikedByCurrentUser,
    toggledByUserId: userId,
  };
}

export async function unlikeLocationAPI(
  locationId: number,
  userId: number
): Promise<LocationLikesSummaryDTO> {
  const response = await fetch(
    `${LOCATIONS_URL}/${locationId}/like?userId=${userId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    }
  );
  if (!response.ok) {
    const txt = await response.text();
    console.error('Failed to unlike location:', txt);
    throw new Error('Failed to unlike location');
  }
  const location = await response.json();
  return {
    id: location.id,
    likesCount: location.likesCount,
    isNowLiked: location.isLikedByCurrentUser,
    toggledByUserId: userId,
  };
}
