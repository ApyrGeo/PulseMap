import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import { useEffect, useRef } from 'react';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import './MarkerCluster.css';
import './MarkerAnimations.css';
import {
  Location,
  LocationCategory,
  MessagePostDTO,
  ResponseMessagePostDTO,
} from '../Interfaces';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import LocationPopup from './LocationPopup';
import AdminLocationPopup from './admin/AdminLocationPopup';
import { MapBounds } from '../services/LocationsApiService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const categoryColors: { [key: string]: string } = {
  [LocationCategory.NotSet]: '#6B7280', // Gray
  [LocationCategory.Music]: '#8B5CF6', // Purple
  [LocationCategory.Sport]: '#10B981', // Green
  [LocationCategory.Food]: '#F59E0B', // Orange
  [LocationCategory.Entertainment]: '#EF4444', // Red
  [LocationCategory.Education]: '#3B82F6', // Blue
  [LocationCategory.Health]: '#EC4899', // Pink
  [LocationCategory.Technology]: '#14B8A6', // Teal
  [LocationCategory.Travel]: '#F97316', // Orange-Red
  [LocationCategory.Art]: '#A855F7', // Purple-Pink
  [LocationCategory.Business]: '#06B6D4', // Cyan
};

// Create a colored marker icon using divIcon (HTML-based, better for animations)
const getMarkerIcon = (
  category: LocationCategory,
  isExpired: boolean,
  shouldBeColored: boolean,
  hasOwner: boolean
) => {
  const color =
    isExpired || !shouldBeColored
      ? '#6B7280'
      : categoryColors[category] || categoryColors[LocationCategory.NotSet];

  const borderColor = hasOwner ? '#000' : '#fff';

  const html = `
    <div class="teardrop-marker" style="
      width: 30px;
      height: 30px;
      background-color: ${color};
      border: 3px solid ${borderColor};
      border-radius: 50% 50% 50% 0;
      box-shadow: 0 3px 8px rgba(0,0,0,0.3);
      position: relative;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background-color: ${borderColor};
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
      "></div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-marker-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

export interface LocationAnimationState {
  [locationId: number]: 'new' | 'updated' | 'liked' | null;
}

interface LeafletMapProps {
  locations: Location[];
  onMapClick?: (lat: number, lng: number) => void;
  onAddComment?: (message: MessagePostDTO) => Promise<void>;
  onAddResponse?: (message: ResponseMessagePostDTO) => Promise<void>;
  onLike?: (locationId: number) => void;
  onUnlike?: (locationId: number) => void;
  onContextMenu?: (e: React.MouseEvent, location: Location) => void;
  isAdmin?: boolean;
  currentUserId?: number;
  onBoundsChange?: (bounds: MapBounds, zoom: number) => void;
  currentZoom?: number;
  animationStates?: LocationAnimationState;
}

// Zoom level thresholds
export const ZOOM_THRESHOLDS = {
  NEIGHBORHOOD: 13, // Show individual markers (neighborhood/street level)
  CITY: 10, // Show clusters/bubbles (city level)
  // Below CITY zoom level: show count popup
};

const MapClickHandler = ({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

interface MapBoundsHandlerProps {
  onBoundsChange: (bounds: MapBounds, zoom: number) => void;
}

const MapBoundsHandler = ({ onBoundsChange }: MapBoundsHandlerProps) => {
  const map = useMap();

  useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      const mapBounds: MapBounds = {
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      };
      onBoundsChange(mapBounds, zoom);
    },
    zoomend: () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      const mapBounds: MapBounds = {
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
      };
      onBoundsChange(mapBounds, zoom);
    },
  });

  return null;
};

// Component to handle marker animations
interface AnimatedMarkerProps {
  location: Location;
  icon: L.Icon;
  animationState?: 'new' | 'updated' | 'liked' | null;
  onContextMenu?: (e: React.MouseEvent, location: Location) => void;
  isAdmin?: boolean;
  onAddComment?: (message: MessagePostDTO) => Promise<void>;
  onAddResponse?: (message: ResponseMessagePostDTO) => Promise<void>;
  onLike?: (locationId: number) => void;
  onUnlike?: (locationId: number) => void;
}

const AnimatedMarker = ({
  location,
  icon,
  animationState,
  onContextMenu,
  isAdmin,
  onAddComment,
  onAddResponse,
  onLike,
  onUnlike,
}: AnimatedMarkerProps) => {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (!markerRef.current) {
      return;
    }

    if (animationState) {
      // Apply animation immediately without delay
      if (!markerRef.current) return;

      const iconElement = markerRef.current.getElement();
      if (iconElement) {
        // Find the inner div (the actual teardrop shape) to animate
        const innerDiv = iconElement.querySelector('div');

        if (!innerDiv) {
          return;
        }

        // Set transform origin
        innerDiv.style.transformOrigin = 'center center';

        // Ensure the base rotation is set (needed for the teardrop orientation)
        // Then reset animation to allow retriggering
        innerDiv.style.transform = 'rotate(-45deg)';
        innerDiv.style.animation = 'none';
        void innerDiv.offsetWidth; // Force reflow to restart animation

        const animationName =
          animationState === 'new'
            ? 'marker-new 0.8s ease-out'
            : animationState === 'updated'
            ? 'marker-update 0.6s ease-in-out'
            : 'marker-pulse 0.5s ease-in-out';

        innerDiv.style.animation = animationName;

        // Remove the animation after completion
        const duration =
          animationState === 'new'
            ? 800
            : animationState === 'updated'
            ? 600
            : 500;
        const cleanupTimeout = setTimeout(() => {
          innerDiv.style.animation = '';
          innerDiv.style.transformOrigin = '';
        }, duration);

        return () => clearTimeout(cleanupTimeout);
      }
    }
  }, [animationState, location.id]);

  return (
    <Marker
      ref={markerRef}
      position={[location.latitude, location.longitude]}
      icon={icon}
      eventHandlers={
        onContextMenu
          ? {
              contextmenu: (e) => {
                const mouseEvent =
                  e.originalEvent as unknown as React.MouseEvent;
                onContextMenu(mouseEvent, location);
              },
            }
          : undefined
      }
    >
      {isAdmin ? (
        <Popup>
          <AdminLocationPopup location={location} />
        </Popup>
      ) : (
        onAddComment &&
        onAddResponse &&
        onLike &&
        onUnlike && (
          <Popup key={`popup-${location.id}`}>
            <LocationPopup
              location={location}
              onAddComment={onAddComment}
              onAddResponse={onAddResponse}
              onLike={onLike}
              onUnlike={onUnlike}
            />
          </Popup>
        )
      )}
    </Marker>
  );
};

const LeafletMap = ({
  locations,
  onMapClick,
  onAddComment,
  onAddResponse,
  onContextMenu,
  onLike,
  onUnlike,
  isAdmin = false,
  currentUserId,
  onBoundsChange,
  currentZoom = 15,
  animationStates = {},
}: LeafletMapProps) => {
  const center: [number, number] =
    locations.length > 0
      ? [locations[0].latitude, locations[0].longitude]
      : [46.76073058700941, 23.571628332138065];

  const shouldBeColored = (location: Location) => {
    if (isAdmin) {
      return !location.isExpired;
    } else if (currentUserId) {
      return location.creator.id === currentUserId;
    }
    return !location.isExpired;
  };

  // Determine if we should show markers based on zoom level
  const shouldShowMarkers = currentZoom >= ZOOM_THRESHOLDS.NEIGHBORHOOD;
  const shouldShowHeatmap =
    currentZoom >= ZOOM_THRESHOLDS.CITY &&
    currentZoom < ZOOM_THRESHOLDS.NEIGHBORHOOD;
  const shouldShowCountOnly = currentZoom < ZOOM_THRESHOLDS.CITY;

  // Determine color based on location count
  const getColorByCount = (count: number) => {
    if (count < 10) return '#22c55e'; // green
    if (count < 50) return '#eab308'; // yellow
    if (count < 100) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: '90vh', width: '100%' }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap, &copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
        maxZoom={22}
        maxNativeZoom={19}
        subdomains={['a', 'b', 'c', 'd']}
      />

      {shouldShowMarkers && (
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
        >
          {locations.map((loc) => (
            <AnimatedMarker
              key={loc.id}
              location={loc}
              icon={getMarkerIcon(
                loc.category,
                loc.isExpired,
                shouldBeColored(loc),
                loc.owner !== null
              )}
              animationState={animationStates[loc.id]}
              onContextMenu={onContextMenu}
              isAdmin={isAdmin}
              onAddComment={onAddComment}
              onAddResponse={onAddResponse}
              onLike={onLike}
              onUnlike={onUnlike}
            />
          ))}
        </MarkerClusterGroup>
      )}

      {shouldShowHeatmap && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '10px 20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: getColorByCount(locations.length),
            }}
          >
            {locations.length}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            locations in area
          </div>
        </div>
      )}

      {shouldShowCountOnly && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '10px 20px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: getColorByCount(locations.length),
            }}
          >
            {locations.length}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Zoom in more to see locations
          </div>
        </div>
      )}

      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      {onBoundsChange && <MapBoundsHandler onBoundsChange={onBoundsChange} />}
    </MapContainer>
  );
};

export default LeafletMap;
