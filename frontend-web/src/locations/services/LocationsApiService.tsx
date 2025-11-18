import { BASE_API_URL } from '../../core';
import { LocationPostDTO, LocationPutDTO } from '../Interfaces';
import { Location } from '../Interfaces';

const LOCATIONS_URL = BASE_API_URL + '/Location';

export async function fetchLocations(): Promise<Location[]> {
  const response = await fetch(`${LOCATIONS_URL}`);
  if (!response.ok) {
    throw new Error('Failed to fetch locations');
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
    throw new Error('Failed to create location');
  }

  const newLocation = await response.json();
  console.log('Created location:', newLocation);
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
    throw new Error('Failed to update location');
  }

  const updatedLocation = await response.json();
  return {
    ...updatedLocation,
    messages: updatedLocation.messages || [],
  };
}

export async function deleteLocation(id: number): Promise<void> {
  const response = await fetch(`${LOCATIONS_URL}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete location');
  }
}
