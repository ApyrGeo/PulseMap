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
  const confirmedIds = useRef<Set<number>>(new Set(initialInteractedIds));
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (initialInteractedIds.length > 0) {
      initialInteractedIds.forEach((id) => confirmedIds.current.add(id));
    }
  }, [initialInteractedIds]);

  useEffect(() => {
    if (!userCoords) return;
    const nearby = locations.filter((loc) => {
      if (confirmedIds.current.has(loc.id)) return false;
      if (loc.isExpired) return false;
      return haversineDistance(
        userCoords.latitude, userCoords.longitude,
        loc.latitude, loc.longitude
      ) <= PROXIMITY_THRESHOLD_METERS;
    });
    setNearbyLocations(nearby);
  }, [userCoords, locations]);

  const markDismissed = useCallback((locationId: number) => {
    setDismissedIds((prev) => new Set([...prev, locationId]));
  }, []);

  const markInteracted = useCallback((locationId: number) => {
    confirmedIds.current.add(locationId);
    setDismissedIds((prev) => { const next = new Set(prev); next.delete(locationId); return next; });
    setNearbyLocations((prev) => prev.filter((l) => l.id !== locationId));
  }, []);

  return { nearbyLocations, dismissedIds, markDismissed, markInteracted };
}

export { haversineDistance, PROXIMITY_THRESHOLD_METERS };
