import { useState, useEffect, useCallback, useRef } from 'react';
import LeafletMap, {
  LocationAnimationState,
} from '../../../shared/maps/components/LeafletMap';
import { ZOOM_THRESHOLDS } from '../../../shared/maps/mapConstants';
import { useLocations } from '../../../shared/maps/providers/LocationsProvider';
import { useAuth } from '../../../auth/AuthProvider';
import { Location } from '../../../shared/maps/Interfaces';
import AdminContextMenu from './AdminContextMenu';
import {
  fetchLocationsByBounds,
  MapBounds,
} from '../../../shared/maps/services/LocationsApiService';
import {
  fetchEventsByBounds,
  EventResponseDTO,
} from '../../events/services/EventsApiService';
import '../../../shared/maps/LocationsPage.css';

const AdminMapComponent = () => {
  const {
    deleteLocationById,
    expireLocationById,
    extendLocationById,
    allLocations,
    refreshLocations,
  } = useLocations();
  const { user } = useAuth();

  const [visibleLocations, setVisibleLocations] = useState<Location[]>([]);
  const [visibleEvents, setVisibleEvents] = useState<EventResponseDTO[]>([]);
  const [currentZoom, setCurrentZoom] = useState(7);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    location: Location;
  } | null>(null);
  const [animationStates, setAnimationStates] =
    useState<LocationAnimationState>({});
  const [lastBounds, setLastBounds] = useState<MapBounds | null>(null);
  const seenLocationIdsRef = useRef<Set<number>>(new Set());
  const prevVisibleLocationsRef = useRef<Location[]>([]);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  // Load initial locations on mount (admin sees all) - only once when user is available
  useEffect(() => {
    if (user?.id && !isInitialLoadDone) {
      refreshLocations(false);
      setIsInitialLoadDone(true);
    }
  }, [user?.id, isInitialLoadDone, refreshLocations]);

  useEffect(() => {
    allLocations.forEach((loc) => {
      seenLocationIdsRef.current.add(loc.id);
    });
  }, [allLocations]);

  // Merge allLocations from WebSocket with bounds-filtered locations
  useEffect(() => {
    if (!lastBounds) return;

    const filtered = allLocations.filter((loc) => {
      return (
        loc.latitude >= lastBounds.minLat &&
        loc.latitude <= lastBounds.maxLat &&
        loc.longitude >= lastBounds.minLng &&
        loc.longitude <= lastBounds.maxLng
      );
    });

    // Check for changes to trigger animations
    const prevLocationsRef = new Map(
      prevVisibleLocationsRef.current.map((loc) => [loc.id, loc])
    );

    filtered.forEach((loc) => {
      const prev = prevLocationsRef.get(loc.id);

      // Only animate if this is truly new (not just entering bounds)
      if (!prev && !seenLocationIdsRef.current.has(loc.id)) {
        // New location from WebSocket
        setAnimationStates((states) => ({ ...states, [loc.id]: 'new' }));
        setTimeout(() => {
          setAnimationStates((states) => ({ ...states, [loc.id]: null }));
        }, 1800);
      } else if (
        prev &&
        prev.likesCount !== undefined &&
        loc.likesCount !== undefined &&
        loc.likesCount > prev.likesCount
      ) {
        // Location got liked
        setAnimationStates((states) => ({ ...states, [loc.id]: 'liked' }));
        setTimeout(() => {
          setAnimationStates((states) => ({ ...states, [loc.id]: null }));
        }, 500);
      } else if (
        prev &&
        JSON.stringify(prev) !== JSON.stringify(loc) &&
        prev.likesCount === loc.likesCount
      ) {
        // Location updated (but not just likes)
        setAnimationStates((states) => ({ ...states, [loc.id]: 'updated' }));
        setTimeout(() => {
          setAnimationStates((states) => ({ ...states, [loc.id]: null }));
        }, 600);
      }
    });

    prevVisibleLocationsRef.current = filtered;
    setVisibleLocations(filtered);
  }, [allLocations, lastBounds]);

  const handleBoundsChange = useCallback(
    async (bounds: MapBounds, zoom: number) => {
      setCurrentZoom(zoom);
      setLastBounds(bounds);

      if (zoom < ZOOM_THRESHOLDS.CITY) {
        setVisibleEvents([]);
        setLastBounds(null);
        return;
      }

      try {
        // Fetch locations for zoom >= CITY
        await fetchLocationsByBounds(bounds, false, undefined, user?.id); // Admin sees all

        // Fetch events for zoom >= CITY (always fetch to show count in footer)
        const events = await fetchEventsByBounds(bounds, true);
        setVisibleEvents(events);

        // Don't set visibleLocations here - let the useEffect handle it
      } catch (error) {
        console.error('Failed to fetch locations/events by bounds:', error);
      }
    },
    [user?.id]
  );

  const handleContextMenu = (e: React.MouseEvent, location: Location) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, location });
  };

  const handleExpire = async () => {
    if (contextMenu) {
      if (
        window.confirm(
          'Are you sure you want to expire this location immediately?'
        )
      ) {
        try {
          const locationId = contextMenu.location.id;
          setAnimationStates((states) => ({
            ...states,
            [locationId]: 'expired',
          }));
          await new Promise((resolve) => setTimeout(resolve, 700));
          await expireLocationById(contextMenu.location.id);
          setTimeout(() => {
            setAnimationStates((states) => ({ ...states, [locationId]: null }));
          }, 250);
          setContextMenu(null);
        } catch {
          alert('Failed to expire location');
        }
      }
    }
  };

  const handleDelete = async () => {
    if (contextMenu) {
      if (window.confirm('Are you sure you want to delete this location?')) {
        try {
          const locationId = contextMenu.location.id;
          setAnimationStates((states) => ({
            ...states,
            [locationId]: 'deleted',
          }));
          await new Promise((resolve) => setTimeout(resolve, 450));
          await deleteLocationById(contextMenu.location.id);
          setContextMenu(null);
        } catch {
          alert('Failed to delete location');
        }
      }
    }
  };

  const handleExtend = async () => {
    if (contextMenu) {
      if (
        window.confirm(
          'Are you sure you want to extend this location expiration?'
        )
      ) {
        try {
          await extendLocationById(contextMenu.location.id);
        } catch {
          alert('Failed to extend location');
        }
      }
    }
  };

  return (
    <div className="locations-page">
      <div className="locations-map-container" style={{ height: '100%', boxSizing: 'border-box' }}>
        <LeafletMap
          locations={visibleLocations}
          events={visibleEvents}
          onContextMenu={handleContextMenu}
          isAdmin={true}
          onBoundsChange={handleBoundsChange}
          currentZoom={currentZoom}
          animationStates={animationStates}
        />
      </div>

      {contextMenu && (
        <AdminContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isExpired={contextMenu.location.isExpired}
          onExpire={handleExpire}
          onDelete={handleDelete}
          onExtend={handleExtend}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default AdminMapComponent;
