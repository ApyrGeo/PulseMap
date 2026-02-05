import { BASE_API_URL } from '../../core';

const AI_URL = BASE_API_URL + '/AI';

export interface MergeResultItem {
  action: string;
  location1Id: number;
  location2Id: number;
  distance: string;
  matchResult: string;
}

export interface CheckMergeResponse {
  message: string;
  mergedCount: number;
  results: MergeResultItem[];
}

export interface ForceMergeRequest {
  keepLocationId: number;
  removeLocationId: number;
}

export async function checkAndMergeDuplicates(
  maxDistanceMeters: number
): Promise<CheckMergeResponse> {
  const response = await fetch(
    `${AI_URL}/check-and-merge-duplicates?maxDistanceMeters=${maxDistanceMeters}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to check and merge duplicates:', errorText);
    throw new Error('Failed to check and merge duplicates');
  }

  return response.json();
}

export async function forceMergeLocations(
  request: ForceMergeRequest
): Promise<void> {
  const response = await fetch(`${AI_URL}/force-merge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to force merge locations:', errorText);
    throw new Error('Failed to force merge locations');
  }
}
