import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import LeafletMap from '../../../shared/maps/components/LeafletMap';
import { ZOOM_THRESHOLDS } from '../../../shared/maps/mapConstants';
import { useLocations } from '../../../shared/maps/providers/LocationsProvider';
import { useAuth } from '../../../auth/AuthProvider';
import {
  LocationPostDTO,
  MessagePostDTO,
  ResponseMessagePostDTO,
  Location,
  LocationCategory,
} from '../../../shared/maps/Interfaces';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
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

const UserMapComponent = () => {
  const {
    addLocation,
    addCommentToLocation,
    addResponseToMessage,
    likeLocation,
    unlikeLocation,
    activeLocations,
    refreshLocations,
    ownedLocations,
  } = useLocations();
  const { user } = useAuth();

  const [visibleLocations, setVisibleLocations] = useState<Location[]>([]);
  const [visibleEvents, setVisibleEvents] = useState<EventResponseDTO[]>([]);
  const [currentZoom, setCurrentZoom] = useState(15);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [lastBounds, setLastBounds] = useState<MapBounds | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  // Load initial locations on mount - only once when user is available
  useEffect(() => {
    if (user?.id && !isInitialLoadDone) {
      refreshLocations(true);
      setIsInitialLoadDone(true);
    }
  }, [user?.id, isInitialLoadDone, refreshLocations]);

  // Merge activeLocations from WebSocket with bounds-filtered locations
  useEffect(() => {
    if (!lastBounds) return;

    const selectedNorm = selectedType
      ? selectedType.replace(/\s+/g, '').toLowerCase()
      : null;

    // Filter activeLocations by current bounds and selected type (if any)
    const filtered = activeLocations.filter((loc) => {
      const inBounds =
        loc.latitude >= lastBounds.minLat &&
        loc.latitude <= lastBounds.maxLat &&
        loc.longitude >= lastBounds.minLng &&
        loc.longitude <= lastBounds.maxLng;

      if (!inBounds) return false;

      if (!selectedNorm) return true;

      const cat = (loc.category ?? '').toString();
      const catNorm = cat.replace(/\s+/g, '').toLowerCase();
      return catNorm === selectedNorm;
    });

    setVisibleLocations(filtered);
  }, [activeLocations, lastBounds, selectedType]);

  const handleBoundsChange = useCallback(
    async (bounds: MapBounds, zoom: number) => {
      setCurrentZoom(zoom);
      setLastBounds(bounds);

      // Don't fetch if zoomed out too far
      if (zoom < ZOOM_THRESHOLDS.CITY) {
        setVisibleLocations([]);
        setLastBounds(null);
        return;
      }

      try {
        const typeForApi = selectedType
          ? selectedType.replace(/\s+/g, '')
          : null;
        const data = await fetchLocationsByBounds(
          bounds,
          true,
          typeForApi,
          user?.id
        );
        // Use server response immediately to populate visible locations
        setVisibleLocations(data);

        // Fetch events for zoom >= CITY
        const events = await fetchEventsByBounds(bounds, true);
        setVisibleEvents(events);
      } catch (error) {
        console.error('Failed to fetch locations by bounds:', error);
      }
    },
    [selectedType, user?.id]
  );

  // Re-fetch when the selected type filter changes while we have bounds
  useEffect(() => {
    if (!lastBounds) return;
    if (currentZoom < ZOOM_THRESHOLDS.CITY) return;

    (async () => {
      try {
        const typeForApi = selectedType
          ? selectedType.replace(/\s+/g, '')
          : null;
        const data = await fetchLocationsByBounds(
          lastBounds,
          true,
          typeForApi,
          user?.id
        );
        setVisibleLocations(data);
      } catch (err) {
        console.error(
          'Failed to fetch locations by bounds (type change):',
          err
        );
      }
    })();
  }, [selectedType, lastBounds, currentZoom, user?.id]);

  const handleMapClick = (lat: number, lng: number) => {
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
    await addLocation(location);
    setAddModalOpen(false);
    setClickedCoords(null);
  };

  const handleAddComment = async (message: MessagePostDTO) => {
    await addCommentToLocation(message);
  };

  const handleAddResponse = async (message: ResponseMessagePostDTO) => {
    await addResponseToMessage(message);
  };
  const handleLike = async (locationId: number) => {
    await likeLocation(locationId);
  };
  const handleUnlike = async (locationId: number) => {
    await unlikeLocation(locationId);
  };

  return (
    <div className="locations-page">
      <div className="locations-map-container">
        <div style={{ width: 260, marginBottom: 8 }}>
          <Autocomplete
            size="small"
            options={['None', ...Object.values(LocationCategory)]}
            value={selectedType ?? 'None'}
            onChange={(_, value) =>
              setSelectedType(value === 'None' ? null : value)
            }
            renderInput={(params) => (
              <TextField {...params} label="Ping Type" variant="outlined" />
            )}
          />
        </div>

        <LeafletMap
          locations={visibleLocations}
          events={visibleEvents}
          onMapClick={handleMapClick}
          onAddComment={handleAddComment}
          onAddResponse={handleAddResponse}
          onLike={handleLike}
          onUnlike={handleUnlike}
          onBoundsChange={handleBoundsChange}
          currentZoom={currentZoom}
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
          hasOwnedLocation={!!ownedLocations.find((loc) => !loc.isExpired)}
        />
      )}
    </div>
  );
};

export default UserMapComponent;
