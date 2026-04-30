import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import MapView, { Marker, Region } from 'react-native-maps';
import {
  useLocations,
  useAuth,
  recordInteraction,
  InteractionType,
  fetchLocationsByBounds,
  fetchEventsByBounds,
  EventResponseDTO,
  Location,
  MapBounds,
  reportLocation,
  ReportType,
} from '@pulse-map/shared';
import { useProximityDetection } from '../hooks/useProximityDetection';
import { useDeviceLocation } from '../contexts/LocationContext';
import { Icons } from '../utils/icons';
import ProximityCardStack from '../components/ProximityCardStack';
import AddLocationModal from '../components/AddLocationModal';
import LocationDetailModal from '../components/LocationDetailModal';

const ZOOM_NEIGHBORHOOD = 15;
const ZOOM_EVENT = 12;   // 3 niveluri de zoom pentru events: 12, 13, 14
const ZOOM_CITY = 6;

function latDeltaToZoom(latitudeDelta: number): number {
  return Math.round(Math.log2(360 / latitudeDelta));
}

const CATEGORY_COLORS: Record<string, string> = {
  Music: '#8B5CF6',
  Sport: '#10B981',
  Food: '#F59E0B',
  Entertainment: '#EF4444',
  Education: '#3B82F6',
  Health: '#EC4899',
  Technology: '#14B8A6',
  Travel: '#F97316',
  Art: '#A855F7',
  Business: '#06B6D4',
  'Not Set': '#6B7280',
};

export default function MapScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { activeLocations, refreshLocations, interactedLocationIds, markAsInteracted } = useLocations();
  const { user, tokenService } = useAuth();
  const { userCoords } = useDeviceLocation();
  const mapRef = useRef<MapView>(null);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [newLocationCoords, setNewLocationCoords] = useState({ latitude: 0, longitude: 0 });
  const [hasInitialLocation, setHasInitialLocation] = useState(false);

  const [lastBounds, setLastBounds] = useState<MapBounds | null>(null);
  const [currentZoom, setCurrentZoom] = useState(ZOOM_NEIGHBORHOOD);
  const [visibleLocations, setVisibleLocations] = useState<Location[] | null>(null);
  const [visibleEvents, setVisibleEvents] = useState<EventResponseDTO[]>([]);

  const pulseAnims = useRef<Record<number, Animated.Value>>({});

  // Exclude own locations from proximity detection — "Ai fost aici" nu apare pt creatorul locatiei
  // useMemo previne array nou la fiecare render (ar cauza infinite loop in useProximityDetection)
  const locationsForProximity = useMemo(
    () => activeLocations.filter((loc) => loc.creator?.id !== user?.id),
    [activeLocations, user?.id]
  );

  const interactedIdsArray = useMemo(
    () => Array.from(interactedLocationIds),
    [interactedLocationIds]
  );

  const { nearbyLocations, markInteracted } = useProximityDetection(
    locationsForProximity,
    userCoords,
    interactedIdsArray
  );

  // Initial full load — keeps activeLocations populated for proximity detection
  useEffect(() => {
    refreshLocations(true);
  }, [refreshLocations]);

  // Center map once on first GPS fix
  useEffect(() => {
    if (userCoords && !hasInitialLocation) {
      setHasInitialLocation(true);
      mapRef.current?.animateToRegion(
        {
          latitude: userCoords.latitude,
          longitude: userCoords.longitude,
          latitudeDelta: 0.0025,
          longitudeDelta: 0.0025,
        },
        800
      );
    }
  }, [userCoords, hasInitialLocation]);

  // Navigate-to-location from RecommendationsScreen
  useEffect(() => {
    const { focusLocationId, latitude, longitude } = route.params ?? {};
    if (!focusLocationId) return;

    mapRef.current?.animateToRegion(
      {
        latitude,
        longitude,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      },
      600
    );

    const found = activeLocations.find((l) => l.id === focusLocationId);
    if (found) setSelectedLocation(found);

    navigation.setParams({ focusLocationId: undefined, latitude: undefined, longitude: undefined });
  }, [route.params?.focusLocationId]);

  // WS sync: re-filter activeLocations by bounds on WS push, only at neighborhood zoom
  useEffect(() => {
    if (!lastBounds || currentZoom < ZOOM_NEIGHBORHOOD) return;
    const b = lastBounds;
    setVisibleLocations(
      activeLocations.filter(
        (loc) =>
          loc.latitude >= b.minLat &&
          loc.latitude <= b.maxLat &&
          loc.longitude >= b.minLng &&
          loc.longitude <= b.maxLng
      )
    );
  }, [activeLocations, lastBounds, currentZoom]);

  // Pulse animations for nearby markers
  useEffect(() => {
    nearbyLocations.forEach((loc) => {
      if (!pulseAnims.current[loc.id]) {
        pulseAnims.current[loc.id] = new Animated.Value(1);
      }
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnims.current[loc.id], {
            toValue: 1.4,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnims.current[loc.id], {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [nearbyLocations]);

  const handleConfirmInteraction = useCallback(
    async (location: Location) => {
      if (!user) return;
      try {
        await recordInteraction(tokenService, {
          userId: user.id,
          locationId: location.id,
          type: InteractionType.Confirmed,
        });
      } catch {
        // 409 = already interacted — still dismiss the card
      } finally {
        markInteracted(location.id);
        markAsInteracted(location.id);
      }
    },
    [user, tokenService, markInteracted, markAsInteracted]
  );

  const handleDismissCard = useCallback(
    (location: Location) => {
      markInteracted(location.id);
    },
    [markInteracted]
  );

  const handleReportCard = useCallback(
    async (location: Location) => {
      if (!user) return;
      try {
        await reportLocation(tokenService, {
          userId: user.id,
          locationId: location.id,
          type: ReportType.LocationDoesNotExist,
        });
      } catch {
        // 409 = already reported — still dismiss
      } finally {
        markInteracted(location.id);
      }
    },
    [user, tokenService, markInteracted]
  );

  const handleMarkerPress = useCallback(
    async (location: Location) => {
      const isNearby = nearbyLocations.some((l) => l.id === location.id);
      if (isNearby && user) {
        try {
          await recordInteraction(tokenService, {
            userId: user.id,
            locationId: location.id,
            type: InteractionType.ProximityTap,
          });
        } catch {
          // 409 = already interacted
        } finally {
          markInteracted(location.id);
          markAsInteracted(location.id);
        }
      }
      setSelectedLocation(location);
    },
    [nearbyLocations, user, tokenService, markInteracted, markAsInteracted]
  );

  const handleRegionChangeComplete = useCallback(
    async (region: Region) => {
      const zoom = latDeltaToZoom(region.latitudeDelta);
      setCurrentZoom(zoom);

      // Below city level: hide everything
      if (zoom < ZOOM_CITY) {
        setVisibleLocations([]);
        setVisibleEvents([]);
        setLastBounds(null);
        return;
      }

      const bounds: MapBounds = {
        minLat: region.latitude - region.latitudeDelta / 2,
        maxLat: region.latitude + region.latitudeDelta / 2,
        minLng: region.longitude - region.longitudeDelta / 2,
        maxLng: region.longitude + region.longitudeDelta / 2,
      };
      setLastBounds(bounds);

      if (zoom >= ZOOM_NEIGHBORHOOD) {
        // Neighborhood zoom: show individual location markers
        setVisibleEvents([]);
        try {
          const data = await fetchLocationsByBounds(tokenService, bounds, true, user?.id);
          setVisibleLocations(data);
        } catch (e) {
          console.error('Failed to fetch locations by bounds', e);
        }
      } else if (zoom >= ZOOM_EVENT) {
        // Event zoom (12, 13, 14): show event circles only
        setVisibleLocations([]);
        try {
          const events = await fetchEventsByBounds(tokenService, bounds);
          setVisibleEvents(events);
        } catch (e) {
          console.error('Failed to fetch events by bounds', e);
          setVisibleEvents([]);
        }
      } else {
        // Between CITY and EVENT: show nothing
        setVisibleLocations([]);
        setVisibleEvents([]);
      }
    },
    [tokenService, user?.id]
  );

  const handleFABPress = () => {
    const lat = userCoords?.latitude ?? 46.76073058700941;
    const lng = userCoords?.longitude ?? 23.571628332138065;
    setNewLocationCoords({ latitude: lat, longitude: lng });
    setAddModalVisible(true);
  };

  // Determine which markers to show based on zoom
  const markersToShow =
    currentZoom >= ZOOM_NEIGHBORHOOD
      ? (visibleLocations ?? activeLocations)
      : [];

  const nearbyIds = new Set(nearbyLocations.map((l) => l.id));

  const initialRegion: Region = {
    latitude: userCoords?.latitude ?? 46.76073058700941,
    longitude: userCoords?.longitude ?? 23.571628332138065,
    latitudeDelta: 0.0025,
    longitudeDelta: 0.0025,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        onRegionChangeComplete={handleRegionChangeComplete}
        events={visibleEvents}
      >
        {markersToShow.map((location) => {
          const isNearby = nearbyIds.has(location.id);
          const color = CATEGORY_COLORS[location.category] ?? '#FF6B35';
          const pulseAnim = pulseAnims.current[location.id];

          return (
            <Marker
              key={location.id}
              coordinate={{ latitude: location.latitude, longitude: location.longitude }}
              onPress={() => handleMarkerPress(location)}
              category={location.category}
              isExpired={location.isExpired}
              isNearby={isNearby}
            >
              <Animated.View
                style={[
                  styles.markerContainer,
                  isNearby && pulseAnim ? { transform: [{ scale: pulseAnim }] } : undefined,
                ]}
              >
                <View
                  style={[
                    styles.marker,
                    { backgroundColor: color },
                    isNearby && styles.markerNearby,
                  ]}
                />
                {isNearby && <View style={[styles.markerRing, { borderColor: color }]} />}
              </Animated.View>
            </Marker>
          );
        })}
      </MapView>

      {userCoords && (
        <TouchableOpacity
          style={styles.recenterBtn}
          onPress={() =>
            mapRef.current?.animateToRegion(
              {
                latitude: userCoords.latitude,
                longitude: userCoords.longitude,
                latitudeDelta: 0.0025,
                longitudeDelta: 0.0025,
              },
              400
            )
          }
        >
          <Image source={Icons.center} style={styles.recenterIcon} />
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.fab} onPress={handleFABPress}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {!userCoords && (
        <View style={styles.gpsBanner}>
          <Text style={styles.gpsBannerText}>📍 Activați GPS-ul pentru a folosi harta</Text>
        </View>
      )}

      <ProximityCardStack
        locations={nearbyLocations}
        onConfirm={handleConfirmInteraction}
        onDismiss={handleDismissCard}
        onReport={handleReportCard}
      />

      <AddLocationModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        latitude={newLocationCoords.latitude}
        longitude={newLocationCoords.longitude}
      />

      {selectedLocation && (
        <LocationDetailModal
          key={selectedLocation.id}
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  gpsBanner: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    backgroundColor: '#2D1F0A',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F59E0B55',
    zIndex: 100,
    alignItems: 'center',
  },
  gpsBannerText: { color: '#F59E0B', fontSize: 13, fontWeight: '500' },
  markerContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerNearby: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
  },
  markerRing: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    opacity: 0.4,
  },
  recenterBtn: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#1A1A2E',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  recenterIcon: {
    width: 22,
    height: 22,
    tintColor: '#FF6B35',
  },
  fab: {
    position: 'absolute',
    bottom: 84,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  fabIcon: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
});
