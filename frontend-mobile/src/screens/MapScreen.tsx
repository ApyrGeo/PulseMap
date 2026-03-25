import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useLocations, useAuth, recordInteraction, InteractionType } from '@pulse-map/shared';
import { useProximityDetection } from '../hooks/useProximityDetection';
import ProximityCardStack from '../components/ProximityCardStack';
import AddLocationModal from '../components/AddLocationModal';
import LocationDetailModal from '../components/LocationDetailModal';
import { Location } from '@pulse-map/shared';

const CATEGORY_COLORS: Record<string, string> = {
  Music: '#9B59B6',
  Sport: '#27AE60',
  Food: '#E74C3C',
  Entertainment: '#F39C12',
  Education: '#3498DB',
  Health: '#1ABC9C',
  Technology: '#2980B9',
  Travel: '#E67E22',
  Art: '#E91E63',
  Business: '#607D8B',
  'Not Set': '#8E8E8E',
};

export default function MapScreen() {
  const { activeLocations, refreshLocations } = useLocations();
  const { user, tokenService } = useAuth();
  const mapRef = useRef<MapView>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [newLocationCoords, setNewLocationCoords] = useState({ latitude: 0, longitude: 0 });
  const [hasInitialLocation, setHasInitialLocation] = useState(false);
  const pulseAnims = useRef<Record<number, Animated.Value>>({});

  const { userCoords, nearbyLocations, markInteracted } = useProximityDetection(activeLocations);

  // Initial data load
  useEffect(() => {
    refreshLocations(true);
  }, [refreshLocations]);

  // Center map on user location once we get it
  useEffect(() => {
    if (userCoords && !hasInitialLocation) {
      setHasInitialLocation(true);
      mapRef.current?.animateToRegion({
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 800);
    } else if (userCoords && hasInitialLocation) {
      mapRef.current?.animateToRegion({
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 400);
    }
  }, [userCoords]);

  // Manage pulse animations for nearby markers
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
        markInteracted(location.id);
      } catch (e) {
        console.error('Failed to record interaction', e);
      }
    },
    [user, tokenService, markInteracted]
  );

  const handleDismissCard = useCallback(
    (location: Location) => {
      markInteracted(location.id);
    },
    [markInteracted]
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
          markInteracted(location.id);
        } catch (e) {
          console.error('Failed to record proximity tap', e);
        }
      }
      setSelectedLocation(location);
    },
    [nearbyLocations, user, tokenService, markInteracted]
  );

  const handleFABPress = () => {
    if (!userCoords) {
      Alert.alert('Location unavailable', 'Waiting for your GPS location...');
      return;
    }
    setNewLocationCoords({
      latitude: userCoords.latitude,
      longitude: userCoords.longitude,
    });
    setAddModalVisible(true);
  };

  const nearbyIds = new Set(nearbyLocations.map((l) => l.id));

  const initialRegion: Region = {
    latitude: userCoords?.latitude ?? 44.4268,
    longitude: userCoords?.longitude ?? 26.1025,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {activeLocations.map((location) => {
          const isNearby = nearbyIds.has(location.id);
          const color = CATEGORY_COLORS[location.category] ?? '#FF6B35';
          const pulseAnim = pulseAnims.current[location.id];

          return (
            <Marker
              key={location.id}
              coordinate={{ latitude: location.latitude, longitude: location.longitude }}
              onPress={() => handleMarkerPress(location)}
            >
              <Animated.View
                style={[
                  styles.markerContainer,
                  isNearby && pulseAnim
                    ? { transform: [{ scale: pulseAnim }] }
                    : undefined,
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

      {/* Recenter button */}
      {userCoords && (
        <TouchableOpacity
          style={styles.recenterBtn}
          onPress={() =>
            mapRef.current?.animateToRegion({
              latitude: userCoords.latitude,
              longitude: userCoords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 400)
          }
        >
          <Text style={styles.recenterIcon}>◎</Text>
        </TouchableOpacity>
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleFABPress}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Proximity cards */}
      <ProximityCardStack
        locations={nearbyLocations}
        onConfirm={handleConfirmInteraction}
        onDismiss={handleDismissCard}
      />

      {/* Add location modal */}
      <AddLocationModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        latitude={newLocationCoords.latitude}
        longitude={newLocationCoords.longitude}
      />

      {/* Location detail modal */}
      {selectedLocation && (
        <LocationDetailModal
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
    color: '#FF6B35',
    fontSize: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 200,
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
