import { BASE_API_URL } from '../../core';

export interface FeaturedLocation {
  id: number;
  name: string;
  imageUrls: string[];
  likesCount: number;
  creatorUsername?: string;
}

export const fetchFeaturedLocations = async (count = 15): Promise<FeaturedLocation[]> => {
  const res = await fetch(`${BASE_API_URL}/Location/featured?count=${count}`);
  if (!res.ok) throw new Error('Failed to fetch featured locations');
  return res.json();
};
