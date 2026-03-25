// Web shim for react-native-geolocation-service
// Uses browser navigator.geolocation API

interface GeoPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

interface GeoError {
  code: number;
  message: string;
}

interface WatchOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  distanceFilter?: number;
  interval?: number;
  fastestInterval?: number;
}

const Geolocation = {
  getCurrentPosition(
    success: (position: GeoPosition) => void,
    error?: (error: GeoError) => void,
    options?: WatchOptions
  ): void {
    if (!navigator.geolocation) {
      error?.({ code: 2, message: 'Geolocation not supported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => success({
        coords: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        },
        timestamp: pos.timestamp,
      }),
      (err) => error?.({ code: err.code, message: err.message }),
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 15000,
        maximumAge: options?.maximumAge ?? 0,
      }
    );
  },

  watchPosition(
    success: (position: GeoPosition) => void,
    error?: (error: GeoError) => void,
    options?: WatchOptions
  ): number {
    if (!navigator.geolocation) {
      error?.({ code: 2, message: 'Geolocation not supported' });
      return -1;
    }
    return navigator.geolocation.watchPosition(
      (pos) => success({
        coords: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
        },
        timestamp: pos.timestamp,
      }),
      (err) => error?.({ code: err.code, message: err.message }),
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 15000,
        maximumAge: options?.maximumAge ?? 0,
      }
    );
  },

  clearWatch(watchId: number): void {
    if (navigator.geolocation && watchId >= 0) {
      navigator.geolocation.clearWatch(watchId);
    }
  },

  stopObserving(): void {
    // No-op on web
  },

  requestAuthorization(): void {
    // No-op on web — browser prompts automatically
  },
};

export default Geolocation;
