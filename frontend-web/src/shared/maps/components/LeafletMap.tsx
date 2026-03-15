import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  Circle,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import { useEffect, useRef, memo, useCallback } from 'react';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import './MarkerCluster.css';
import './MarkerAnimations.css';
import {
  Location,
  MessagePostDTO,
  ResponseMessagePostDTO,
} from '../Interfaces';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import LocationPopup from './LocationPopup';
import AdminLocationPopup from '../../../admin/map/components/AdminLocationPopup';
import { MapBounds } from '../services/LocationsApiService';
import { EventResponseDTO } from '../../../admin/events/services/EventsApiService';
import { ZOOM_THRESHOLDS } from '../mapConstants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const fallbackPalette = [
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#3B82F6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#A855F7',
  '#06B6D4',
];

const knownCategoryColors: { [key: string]: string } = {
  'Not Set': '#6B7280',
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
};

const getCategoryColor = (category: string) => {
  const exact = knownCategoryColors[category];
  if (exact) {
    return exact;
  }

  const key = (category || '').toLowerCase();
  if (!key) {
    return '#6B7280';
  }

  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }

  return fallbackPalette[Math.abs(hash) % fallbackPalette.length];
};

// Create a colored marker icon using divIcon (HTML-based, better for animations)
const getMarkerIcon = (
  category: string,
  isExpired: boolean,
  shouldBeColored: boolean,
  hasOwner: boolean
) => {
  const color =
    isExpired || !shouldBeColored ? '#6B7280' : getCategoryColor(category);

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

// Calculate event radius from locations (Haversine distance)
const calculateEventRadius = (
  centerLat: number,
  centerLng: number,
  locations: Location[]
): number => {
  if (locations.length === 0) return 100;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const distances = locations.map((loc) => {
    const R = 6371000; // Earth radius in meters
    const dLat = toRad(loc.latitude - centerLat);
    const dLng = toRad(loc.longitude - centerLng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(centerLat)) *
        Math.cos(toRad(loc.latitude)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  });

  return Math.max(...distances) + 50; // Add 50m buffer
};

// Create event marker icon (pulsing circle)
const getEventIcon = (category: string, locationsCount: number) => {
  const color = '#ef4444'; // Red for events
  const size = Math.min(50 + locationsCount * 2, 100); // Scale based on locations count

  const html = `
    <div class="event-marker" style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${color};
      border: 4px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
      position: relative;
      animation: event-pulse 2s ease-in-out infinite;
      cursor: pointer;
    ">
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-weight: bold;
        font-size: ${Math.max(12, size / 4)}px;
        text-shadow: 0 1px 3px rgba(0,0,0,0.5);
      ">${locationsCount}</div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'event-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

export interface LocationAnimationState {
  [locationId: number]:
    | 'new'
    | 'updated'
    | 'liked'
    | 'expired'
    | 'deleted'
    | null;
}

interface LeafletMapProps {
  locations: Location[];
  events?: EventResponseDTO[];
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
  focusLocationId?: number | null;
  focusRequestKey?: number;
}

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

// Component for event markers
interface EventMarkerProps {
  event: EventResponseDTO;
  onClick: (event: EventResponseDTO) => void;
}

const EventMarker = ({ event, onClick }: EventMarkerProps) => {
  const map = useMap();

  // Safety check for coordinates
  if (!event.latitude || !event.longitude) {
    console.warn('Event missing coordinates:', event);
    return null;
  }

  // Calculate radius from locations if available (approximate)
  const radius =
    event.locations && event.locations.length > 0
      ? calculateEventRadius(event.latitude, event.longitude, event.locations)
      : 100; // Default 100m if no locations

  const handleClick = () => {
    // Zoom into the event area
    map.setView(
      [event.latitude, event.longitude],
      ZOOM_THRESHOLDS.NEIGHBORHOOD
    );
    onClick(event);
  };

  return (
    <>
      <Circle
        center={[event.latitude, event.longitude]}
        radius={radius}
        pathOptions={{
          color: '#dc2626',
          fillColor: '#ef4444',
          fillOpacity: 0.35,
          weight: 3,
          dashArray: '5, 10',
        }}
      />
      <Marker
        position={[event.latitude, event.longitude]}
        icon={getEventIcon(event.name, event.locationsCount)}
        eventHandlers={{
          click: handleClick,
        }}
      >
        <Tooltip direction="top" offset={[0, -20]} opacity={0.9}>
          <div style={{ minWidth: '180px' }}>
            <h3
              style={{
                margin: '0 0 6px 0',
                fontSize: '16px',
                color: '#1f2937',
              }}
            >
              {event.name}
            </h3>
            <p style={{ margin: '3px 0', fontSize: '13px' }}>
              <strong>Locations:</strong> {event.locationsCount}
            </p>
            <p style={{ margin: '3px 0', fontSize: '13px' }}>
              <strong>Radius:</strong> {radius.toFixed(0)}m
            </p>
            <p style={{ margin: '3px 0', fontSize: '13px' }}>
              <strong>Confidence:</strong>{' '}
              {(event.confidenceScore * 100).toFixed(0)}%
            </p>
            {event.requiresReview && (
              <p
                style={{ margin: '3px 0', fontSize: '13px', color: '#f59e0b' }}
              >
                ⚠️ Needs Review
              </p>
            )}
            <p
              style={{
                margin: '6px 0 0 0',
                fontSize: '11px',
                color: '#6b7280',
                fontStyle: 'italic',
              }}
            >
              Click to zoom in
            </p>
          </div>
        </Tooltip>
      </Marker>
    </>
  );
};

// Component to handle marker animations
interface AnimatedMarkerProps {
  location: Location;
  icon: L.Icon | L.DivIcon;
  animationState?: 'new' | 'updated' | 'liked' | 'expired' | 'deleted' | null;
  onContextMenu?: (e: React.MouseEvent, location: Location) => void;
  isAdmin?: boolean;
  onAddComment?: (message: MessagePostDTO) => Promise<void>;
  onAddResponse?: (message: ResponseMessagePostDTO) => Promise<void>;
  onLike?: (locationId: number) => void;
  onUnlike?: (locationId: number) => void;
  onMarkerReady?: (locationId: number, marker: L.Marker | null) => void;
}

const AnimatedMarker = memo(
  ({
    location,
    icon,
    animationState,
    onContextMenu,
    isAdmin,
    onAddComment,
    onAddResponse,
    onLike,
    onUnlike,
    onMarkerReady,
  }: AnimatedMarkerProps) => {
    const markerRef = useRef<L.Marker>(null);

    const animatePopupOpen = useCallback((marker: L.Marker | null) => {
      if (!marker) {
        return;
      }

      const popup = marker.getPopup();
      const popupElement =
        popup?.getElement() || ((popup as any)?._container as HTMLElement);
      if (!popupElement) {
        return;
      }

      popupElement.classList.remove('popup-open-animate');
      void popupElement.offsetWidth;
      popupElement.classList.add('popup-open-animate');

      const contentWrapper = popupElement.querySelector(
        '.leaflet-popup-content-wrapper'
      ) as HTMLElement | null;

      if (contentWrapper) {
        contentWrapper.classList.remove('popup-open-animate-inner');
        void contentWrapper.offsetWidth;
        contentWrapper.classList.add('popup-open-animate-inner');
      }

      setTimeout(() => {
        popupElement.classList.remove('popup-open-animate');
        contentWrapper?.classList.remove('popup-open-animate-inner');
      }, 420);
    }, []);

    useEffect(() => {
      onMarkerReady?.(location.id, markerRef.current);

      return () => {
        onMarkerReady?.(location.id, null);
      };
    }, [location.id, onMarkerReady]);

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
              : animationState === 'liked'
              ? 'marker-pulse 0.5s ease-in-out'
              : animationState === 'expired'
              ? 'marker-expire 0.7s ease-out'
              : 'marker-delete 0.45s ease-in';

          innerDiv.style.animation = animationName;

          // Remove the animation after completion
          const duration =
            animationState === 'new'
              ? 800
              : animationState === 'updated'
              ? 600
              : animationState === 'liked'
              ? 500
              : animationState === 'expired'
              ? 700
              : 450;
          const cleanupTimeout = setTimeout(() => {
            innerDiv.style.animation = '';
            innerDiv.style.transformOrigin = '';
          }, duration);

          return () => clearTimeout(cleanupTimeout);
        }
      }
      return;
    }, [animationState, location.id]);

    return (
      <Marker
        ref={markerRef}
        position={[location.latitude, location.longitude]}
        icon={icon}
        eventHandlers={{
          popupopen: () => animatePopupOpen(markerRef.current),
          ...(onContextMenu
            ? {
                contextmenu: (e: L.LeafletMouseEvent) => {
                  const mouseEvent =
                    e.originalEvent as unknown as React.MouseEvent;
                  onContextMenu(mouseEvent, location);
                },
              }
            : {}),
        }}
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
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent re-render on like changes
    // Only re-render if important properties change
    const prevLoc = prevProps.location;
    const nextLoc = nextProps.location;

    return (
      prevLoc.id === nextLoc.id &&
      prevLoc.name === nextLoc.name &&
      prevLoc.latitude === nextLoc.latitude &&
      prevLoc.longitude === nextLoc.longitude &&
      prevLoc.category === nextLoc.category &&
      prevLoc.isExpired === nextLoc.isExpired &&
      prevProps.animationState === nextProps.animationState &&
      prevLoc.messages?.length === nextLoc.messages?.length
      // Deliberately excluding likesCount and isLikedByCurrentUser for stability
    );
  }
);

AnimatedMarker.displayName = 'AnimatedMarker';

const MapFocusHandler = ({
  focusLocationId,
  focusRequestKey,
  locations,
  getMarker,
  getClusterGroup,
}: {
  focusLocationId?: number | null;
  focusRequestKey?: number;
  locations: Location[];
  getMarker: (locationId: number) => L.Marker | undefined;
  getClusterGroup: () => any;
}) => {
  const map = useMap();
  const lastHandledFocusRequestRef = useRef<number>(-1);

  const animateMarkerPulse = useCallback((marker: L.Marker) => {
    const iconElement = marker.getElement();
    if (!iconElement) {
      return;
    }

    const innerDiv = iconElement.querySelector('div');
    if (!innerDiv) {
      return;
    }

    innerDiv.style.transformOrigin = 'center center';
    innerDiv.style.transform = 'rotate(-45deg)';
    innerDiv.style.animation = 'none';
    void innerDiv.offsetWidth;
    innerDiv.style.animation = 'marker-pulse 0.6s ease-in-out';

    setTimeout(() => {
      innerDiv.style.animation = '';
      innerDiv.style.transformOrigin = '';
    }, 650);
  }, []);

  useEffect(() => {
    if (!focusLocationId) return;

    const requestKey = focusRequestKey ?? 0;
    if (lastHandledFocusRequestRef.current === requestKey) {
      return;
    }

    const target = locations.find(
      (location) => location.id === focusLocationId
    );
    if (!target) {
      return;
    }

    lastHandledFocusRequestRef.current = requestKey;

    const targetZoom = Math.max(map.getZoom(), ZOOM_THRESHOLDS.NEIGHBORHOOD);
    map.flyTo([target.latitude, target.longitude], targetZoom, {
      duration: 0.6,
    });

    let attempts = 0;
    const maxAttempts = 20;

    const intervalId = setInterval(() => {
      const marker = getMarker(focusLocationId);
      if (!marker) {
        attempts += 1;
        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
        }
        return;
      }

      const animate = () => {
        animateMarkerPulse(marker);
        clearInterval(intervalId);
      };

      const clusterGroup = getClusterGroup();
      if (clusterGroup?.zoomToShowLayer) {
        clusterGroup.zoomToShowLayer(marker, animate);
      } else {
        animate();
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
      }
    }, 120);

    return () => clearInterval(intervalId);
  }, [
    focusLocationId,
    focusRequestKey,
    locations,
    map,
    getMarker,
    getClusterGroup,
    animateMarkerPulse,
  ]);

  return null;
};

const LeafletMap = ({
  locations,
  events = [],
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
  focusLocationId,
  focusRequestKey,
}: LeafletMapProps) => {
  const markerRefs = useRef<Map<number, L.Marker>>(new Map());
  const clusterGroupRef = useRef<any>(null);

  const getMarkerById = useCallback(
    (locationId: number) => markerRefs.current.get(locationId),
    []
  );
  const getClusterGroup = useCallback(() => clusterGroupRef.current, []);

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
  const shouldShowEvents =
    currentZoom >= ZOOM_THRESHOLDS.EVENT &&
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
          ref={clusterGroupRef}
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
              onMarkerReady={(locationId, marker) => {
                if (marker) {
                  markerRefs.current.set(locationId, marker);
                } else {
                  markerRefs.current.delete(locationId);
                }
              }}
            />
          ))}
        </MarkerClusterGroup>
      )}

      {shouldShowEvents &&
        events.length > 0 &&
        events.map((event) => (
          <EventMarker
            key={event.id}
            event={event}
            onClick={(evt) => {
              console.log('Event clicked:', evt);
            }}
          />
        ))}

      {/* Footer showing location and event counts */}
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
          {shouldShowMarkers ? 'locations visible' : 'locations in area'}
        </div>
        {events.length > 0 && (
          <>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#ef4444',
                marginTop: '8px',
              }}
            >
              {events.length}
            </div>
            <div
              style={{ fontSize: '12px', color: '#ef4444', fontWeight: 500 }}
            >
              {shouldShowEvents
                ? 'events visible'
                : 'events in area (zoom in to 7+ to see)'}
            </div>
          </>
        )}
        {shouldShowCountOnly && (
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
            Zoom in to see details
          </div>
        )}
      </div>

      {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
      {onBoundsChange && <MapBoundsHandler onBoundsChange={onBoundsChange} />}
      <MapFocusHandler
        focusLocationId={focusLocationId}
        focusRequestKey={focusRequestKey}
        locations={locations}
        getMarker={getMarkerById}
        getClusterGroup={getClusterGroup}
      />
    </MapContainer>
  );
};

export default LeafletMap;
