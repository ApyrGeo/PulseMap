import { useState, useEffect, useRef, useCallback } from 'react';
import Geolocation from 'react-native-geolocation-service';
import { Platform } from 'react-native';
import { Location } from '@pulse-map/shared';

export interface UserCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

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

async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios' || Platform.OS === 'web') return true;
  // Android-only: dynamically access PermissionsAndroid to avoid web import errors
  const { PermissionsAndroid } = await import('react-native');
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Permission',
      message: 'PulseMap needs your location to show nearby places.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    }
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export function useProximityDetection(locations: Location[]) {
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);
  const [nearbyLocations, setNearbyLocations] = useState<Location[]>([]);
  const interactedIds = useRef<Set<number>>(new Set());
  const watchId = useRef<number | null>(null);

  const markInteracted = useCallback((locationId: number) => {
    interactedIds.current.add(locationId);
    setNearbyLocations((prev) => prev.filter((l) => l.id !== locationId));
  }, []);

  useEffect(() => {
    let mounted = true;

    const startWatching = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission || !mounted) return;

      watchId.current = Geolocation.watchPosition(
        (position) => {
          if (!mounted) return;
          const coords: UserCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setUserCoords(coords);

          const nearby = locations.filter((loc) => {
            if (interactedIds.current.has(loc.id)) return false;
            if (loc.isExpired) return false;
            const dist = haversineDistance(
              coords.latitude,
              coords.longitude,
              loc.latitude,
              loc.longitude
            );
            return dist <= PROXIMITY_THRESHOLD_METERS;
          });

          setNearbyLocations(nearby);
        },
        (error) => console.warn('Geolocation error:', error.message),
        {
          enableHighAccuracy: true,
          distanceFilter: 10,
          interval: 5000,
          fastestInterval: 3000,
        }
      );
    };

    startWatching();

    return () => {
      mounted = false;
      if (watchId.current !== null) {
        Geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [locations]);

  return { userCoords, nearbyLocations, markInteracted };
}

export { haversineDistance, PROXIMITY_THRESHOLD_METERS };
