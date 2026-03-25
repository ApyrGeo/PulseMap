import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapViewProps {
  children?: React.ReactNode;
  style?: object;
  initialRegion?: Region;
  region?: Region;
  showsUserLocation?: boolean;
  followsUserLocation?: boolean;
  provider?: string | null;
  onRegionChangeComplete?: (region: Region) => void;
  onPress?: (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => void;
  [key: string]: unknown;
}

const MapView: React.FC<MapViewProps> = ({ children, style }) => (
  <View style={[styles.map, style]}>
    <Text style={styles.label}>Map (web preview)</Text>
    {children}
  </View>
);

interface MarkerProps {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  [key: string]: unknown;
}

export const Marker: React.FC<MarkerProps> = ({ title, onPress }) => (
  <View style={styles.marker} onTouchEnd={onPress}>
    <Text style={styles.markerText}>{title ?? '📍'}</Text>
  </View>
);

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#888',
    fontSize: 14,
  },
  marker: {
    position: 'absolute',
  },
  markerText: {
    fontSize: 16,
  },
});

export default MapView;
