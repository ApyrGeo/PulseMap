import { getApiUrl } from '../config/environment';
import { UserInteractionStatsDTO, LocationInteractionStatsDTO } from '../types/interaction';

export async function fetchLeaderboard(take = 10): Promise<UserInteractionStatsDTO[]> {
  const response = await fetch(`${getApiUrl()}/Interaction/leaderboard?take=${take}`);
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  return response.json();
}

export async function fetchTopLocations(take = 10): Promise<LocationInteractionStatsDTO[]> {
  const response = await fetch(`${getApiUrl()}/Interaction/top-locations?take=${take}`);
  if (!response.ok) throw new Error('Failed to fetch top locations');
  return response.json();
}
