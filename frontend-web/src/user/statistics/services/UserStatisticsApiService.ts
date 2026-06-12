import { BASE_API_URL } from '../../../core';
import { TokenService } from '../../../auth/TokenService';

export interface UserInteractionStats {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  totalInteractions: number;
}

export interface LocationInteractionStats {
  locationId: number;
  locationName: string;
  totalInteractions: number;
  latitude: number;
  longitude: number;
}

export interface InteractionRecord {
  id: number;
  userId: number;
  locationId: number;
  locationName: string;
  interactedAt: string;
  type: 0 | 1; 
}

export const fetchMyInteractions = async (userId: number): Promise<InteractionRecord[]> => {
  const response = await fetch(`${BASE_API_URL}/Interaction/user/${userId}`, {
    headers: { ...TokenService.getAuthHeader() },
  });
  if (!response.ok) throw new Error('Failed to fetch interactions');
  return response.json();
};

export const fetchLeaderboard = async (take = 20): Promise<UserInteractionStats[]> => {
  const response = await fetch(`${BASE_API_URL}/Interaction/leaderboard?take=${take}`);
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
};

export const fetchTopLocations = async (take = 20): Promise<LocationInteractionStats[]> => {
  const response = await fetch(`${BASE_API_URL}/Interaction/top-locations?take=${take}`);
  if (!response.ok) throw new Error('Failed to fetch top locations');
  return response.json();
};

export const fetchUserLocationCount = async (userId: number): Promise<number> => {
  const response = await fetch(`${BASE_API_URL}/Location?active=false&userId=${userId}`, {
    headers: { ...TokenService.getAuthHeader() },
  });
  if (!response.ok) throw new Error('Failed to fetch user locations');
  const data = await response.json();
  if (!Array.isArray(data)) return 0;
  return data.filter(
    (loc: { creator?: { id: number }; owner?: { id: number } }) =>
      loc.creator?.id === userId || loc.owner?.id === userId
  ).length;
};
