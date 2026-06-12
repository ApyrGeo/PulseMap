import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import LeafletMap, {
  LocationAnimationState,
} from '../../../shared/maps/components/LeafletMap';
import { ZOOM_THRESHOLDS } from '../../../shared/maps/mapConstants';
import { useLocations } from '../../../shared/maps/providers/LocationsProvider';
import { useAuth } from '../../../auth/AuthProvider';
import {
  Location,
  LocationPutDTO,
  LocationPostDTO,
} from '../../../shared/maps/Interfaces';
import OwnerContextMenu from './OwnerContextMenu';
import EditLocationModal from '../../../shared/maps/components/EditLocationModal';
import AddLocationModal from '../../../shared/maps/components/AddLocationModal';
import {
  fetchLocationsByBounds,
  MapBounds,
} from '../../../shared/maps/services/LocationsApiService';
import {
  fetchEventsByBounds,
  EventResponseDTO,
} from '../../../admin/events/services/EventsApiService';
import '../../../shared/maps/LocationsPage.css';

const OwnerMapComponent = () => {
  const { user } = useAuth();
  const {
    updateLocationById,
    deleteLocationById,
    addLocation,
    activeLocations,
    refreshLocations,
  } = useLocations();

  const [visibleLocations, setVisibleLocations] = useState<Location[]>([]);
  const [visibleEvents, setVisibleEvents] = useState<EventResponseDTO[]>([]);
  const [currentZoom, setCurrentZoom] = useState(15);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    location: Location;
  } | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [animationStates, setAnimationStates] =
    useState<LocationAnimationState>({});
  const [lastBounds, setLastBounds] = useState<MapBounds | null>(null);
  const seenLocationIdsRef = useRef<Set<number>>(new Set());
  const prevVisibleLocationsRef = useRef<Location[]>([]);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  useEffect(() => {
    if (user?.id && !isInitialLoadDone) {
      refreshLocations(true);
      setIsInitialLoadDone(true);
    }
  }, [user?.id, isInitialLoadDone, refreshLocations]);

  // Track all seen locations to prevent re-animating on bounds changes
  useEffect(() => {
    activeLocations.forEach((loc) => {
      seenLocationIdsRef.current.add(loc.id);
    });
  }, [activeLocations]);

  useEffect(() => {
    if (!lastBounds) return;

    // Filter activeLocations by current bounds
    const filtered = activeLocations.filter((loc) => {
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
  }, [activeLocations, lastBounds]);

  const handleBoundsChange = useCallback(
    async (bounds: MapBounds, zoom: number) => {
      setCurrentZoom(zoom);
      setLastBounds(bounds);

      if (zoom < ZOOM_THRESHOLDS.CITY) {
        setVisibleLocations([]);
        setLastBounds(null);
        return;
      }

      try {
        await fetchLocationsByBounds(bounds, true, undefined, user?.id);

        // Fetch events for zoom >= CITY
        const events = await fetchEventsByBounds(bounds, true);
        setVisibleEvents(events);

        // Don't set visibleLocations here - let the useEffect handle it
      } catch (error) {
        console.error('Failed to fetch locations by bounds:', error);
      }
    },
    []
  );

  const canAddLocation = !visibleLocations.some(
    (loc) => loc.owner?.id === user?.id
  );

  const handleMapClick = (lat: number, lng: number) => {
    if (!canAddLocation) {
      alert(
        'You can only have one location. Delete your existing location first.'
      );
      return;
    }

    // Don't show any error when zoom is too far out (< 12)
    if (currentZoom < 12) {
      return;
    }

    // Show warning if zoom is between 12 and 15
    if (currentZoom >= 12 && currentZoom <= 15) {
      toast.error(
        (t) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="https://www.ag-grid.com/charts/images/zoom-out-touch.gif"
              alt="Zoom in"
              style={{ width: '50px', height: '50px', borderRadius: '4px' }}
            />
            <span>
              Please zoom in more to be more precise with the placement
            </span>
          </div>
        ),
        { duration: 3000 }
      );
      return;
    }

    // Allow placement when zoom > 15
    setClickedCoords({ lat, lng });
    setAddModalOpen(true);
  };

  const handleAddSubmit = async (location: LocationPostDTO) => {
    if (!user) return;
    location.ownerId = user.id;
    await addLocation(location);
    setAddModalOpen(false);
    setClickedCoords(null);
  };

  const handleContextMenu = (e: React.MouseEvent, location: Location) => {
    e.preventDefault();

    if (location.owner?.id !== user?.id) {
      return;
    }
    setContextMenu({ x: e.clientX, y: e.clientY, location });
  };

  const handleEdit = () => {
    if (contextMenu) {
      setEditingLocation(contextMenu.location);
    }
  };

  const handleDelete = async () => {
    if (contextMenu) {
      if (window.confirm('Are you sure you want to delete this location?')) {
        try {
          await deleteLocationById(contextMenu.location.id);
        } catch {
          alert('Failed to delete location');
        }
      }
    }
  };

  const handleEditSubmit = async (data: LocationPutDTO) => {
    if (editingLocation) {
      try {
        await updateLocationById(editingLocation.id, data);
        setEditingLocation(null);
      } catch {
        alert('Failed to update location');
      }
    }
  };

  return (
    <div className="locations-page">
      <div className="locations-map-container">
        <LeafletMap
          locations={visibleLocations}
          events={visibleEvents}
          onMapClick={handleMapClick}
          onContextMenu={handleContextMenu}
          currentUserId={user?.id}
          onBoundsChange={handleBoundsChange}
          currentZoom={currentZoom}
          animationStates={animationStates}
        />
      </div>

      {clickedCoords && (
        <AddLocationModal
          isOpen={addModalOpen}
          latitude={clickedCoords.lat}
          longitude={clickedCoords.lng}
          onClose={() => {
            setAddModalOpen(false);
            setClickedCoords(null);
          }}
          onSubmit={handleAddSubmit}
          hasOwnedLocation={!canAddLocation}
        />
      )}

      {contextMenu && (
        <OwnerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={() => setContextMenu(null)}
        />
      )}

      {editingLocation && (
        <EditLocationModal
          isOpen={true}
          location={editingLocation}
          onClose={() => setEditingLocation(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
};

export default OwnerMapComponent;
