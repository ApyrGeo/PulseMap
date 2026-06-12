import React, { forwardRef, useImperativeHandle, useEffect, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import {
  MapContainer,
  TileLayer,
  Marker as LeafletMarker,
  CircleMarker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './react-native-maps.web.css';

export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;

const ZOOM_SHOW_MARKERS = 15;

const CATEGORY_COLORS: Record<string, string> = {
  'Not Set':      '#6B7280',
  Music:          '#8B5CF6',
  Sport:          '#10B981',
  Food:           '#F59E0B',
  Entertainment:  '#EF4444',
  Education:      '#3B82F6',
  Health:         '#EC4899',
  Technology:     '#14B8A6',
  Travel:         '#F97316',
  Art:            '#A855F7',
  Business:       '#06B6D4',
};

const tearDropIcon = (category = 'Not Set', isExpired = false, isNearby = false) => {
  const color = isExpired ? '#6B7280' : (CATEGORY_COLORS[category] ?? '#22C55E');
  const borderColor = isNearby ? '#22C55E' : '#fff';
  const size = isNearby ? 34 : 28;
  const cssClass = isNearby ? 'teardrop-marker-nearby' : 'teardrop-marker';

  const html = `
    <div class="${cssClass}" style="
      width:${size}px; height:${size}px;
      background-color:${color};
      border:${isNearby ? '3px' : '2px'} solid ${borderColor};
      border-radius:50% 50% 50% 0;
      box-shadow:0 3px 8px rgba(0,0,0,0.4);
      position:relative;
    ">
      <div style="
        width:${Math.round(size * 0.29)}px; height:${Math.round(size * 0.29)}px;
        background-color:${borderColor};
        border-radius:50%;
        position:absolute; top:50%; left:50%;
        transform:translate(-50%,-50%);
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
}


const MapController = forwardRef<MapViewRef>((_, ref) => {
  const map = useMap();
  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration = 800) => {
      map.flyTo([region.latitude, region.longitude], map.getZoom(), {
        duration: duration / 1000,
        animate: true,
      });
    },
  }));
  return null;
});
MapController.displayName = 'MapController';

const ZoomTracker = ({ onChange }: { onChange: (z: number) => void }) => {
  const map = useMap();

  useEffect(() => { onChange(map.getZoom()); }, [map, onChange]);
  useMapEvents({ zoomend: () => onChange(map.getZoom()) });
  return null;
};

const UserLocationLayer: React.FC = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  if (!position) return null;
  return (
    <>
      <CircleMarker
        center={position}
        radius={10}
        pathOptions={{ color: '#4285F4', fillColor: '#4285F4', fillOpacity: 0.9, weight: 2 }}
      />
      <CircleMarker
        center={position}
        radius={24}
        pathOptions={{ color: '#4285F4', fillColor: '#4285F4', fillOpacity: 0.15, weight: 1 }}
      />
    </>
  );
};

const MapPressHandler: React.FC<{
  onPress?: (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => void;
}> = ({ onPress }) => {
  useMapEvents({
    click: (e) => {
      onPress?.({
        nativeEvent: { coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng } },
      });
    },
  });
  return null;
};


interface MapViewProps {
  children?: React.ReactNode;
  style?: object;
  initialRegion?: Region;
  region?: Region;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  followsUserLocation?: boolean;
  provider?: string | null;
  onRegionChangeComplete?: (region: Region) => void;
  onPress?: (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => void;
  [key: string]: unknown;
}

const MapView = forwardRef<MapViewRef, MapViewProps>(
  ({ children, style, initialRegion, showsUserLocation, onPress }, ref) => {
    const [zoom, setZoom] = useState(15);
    const locationCount = React.Children.count(children);

    const handleZoom = useCallback((z: number) => setZoom(z), []);

    const center: [number, number] = initialRegion
      ? [initialRegion.latitude, initialRegion.longitude]
      : [44.4268, 26.1025];

    return (
      <View style={[{ flex: 1 }, style]}>
        <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
            subdomains={['a', 'b', 'c', 'd']}
            maxZoom={22}
          />
          <MapController ref={ref} />
          <ZoomTracker onChange={handleZoom} />
          {showsUserLocation && <UserLocationLayer />}
          {onPress && <MapPressHandler onPress={onPress} />}
          {zoom >= ZOOM_SHOW_MARKERS ? children : null}
        </MapContainer>

        {/* Zoom-out overlay */}
        {zoom < ZOOM_SHOW_MARKERS && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              backgroundColor: 'rgba(26,26,46,0.88)',
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: '#2D2D44',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 26 }}>
              {locationCount}
            </Text>
            <Text style={{ color: '#8E8E8E', fontSize: 11, marginTop: 1 }}>
              active locations
            </Text>
            <Text style={{ color: '#22C55E', fontSize: 10, marginTop: 4 }}>
              Zoom in to see pins
            </Text>
          </View>
        )}
      </View>
    );
  }
);
MapView.displayName = 'MapView';


interface MarkerProps {
  coordinate: { latitude: number; longitude: number };
  onPress?: () => void;
  children?: React.ReactNode;
  title?: string;
  description?: string;
  category?: string;
  isExpired?: boolean;
  isNearby?: boolean;
  [key: string]: unknown;
}

export const Marker: React.FC<MarkerProps> = ({
  coordinate,
  onPress,
  category = 'Not Set',
  isExpired = false,
  isNearby = false,
}) => (
  <LeafletMarker
    position={[coordinate.latitude, coordinate.longitude]}
    icon={tearDropIcon(category, isExpired, isNearby)}
    eventHandlers={{
      click: (e) => {
        e.originalEvent?.stopPropagation();
        onPress?.();
      },
    }}
  />
);

export default MapView;
