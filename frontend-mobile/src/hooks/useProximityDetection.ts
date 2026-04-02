import { useState, useEffect, useRef, useCallback } from 'react';
import { Location } from '@pulse-map/shared';
import { UserCoords } from '../contexts/LocationContext';

const PROXIMITY_THRESHOLD_METERS = 50;

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useProximityDetection(
  locations: Location[],
  userCoords: UserCoords | null,
  initialInteractedIds: number[] = []
) {
  const [nearbyLocations, setNearbyLocations] = useState<Location[]>([]);
  const interactedIds = useRef<Set<number>>(new Set(initialInteractedIds));

  useEffect(() => {
    if (initialInteractedIds.length > 0) {
      initialInteractedIds.forEach((id) => interactedIds.current.add(id));
    }
  }, [initialInteractedIds]);

  const markInteracted = useCallback((locationId: number) => {
    interactedIds.current.add(locationId);
    setNearbyLocations((prev) => prev.filter((l) => l.id !== locationId));
  }, []);

  useEffect(() => {
    if (!userCoords) return;
    const nearby = locations.filter((loc) => {
      if (interactedIds.current.has(loc.id)) return false;
      if (loc.isExpired) return false;
      return haversineDistance(
        userCoords.latitude, userCoords.longitude,
        loc.latitude, loc.longitude
      ) <= PROXIMITY_THRESHOLD_METERS;
    });
    setNearbyLocations(nearby);
  }, [userCoords, locations]);

  return { nearbyLocations, markInteracted };
}

export { haversineDistance, PROXIMITY_THRESHOLD_METERS };
