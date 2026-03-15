import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import LeafletMap, {
  LocationAnimationState,
} from '../../../shared/maps/components/LeafletMap';
import { ZOOM_THRESHOLDS } from '../../../shared/maps/mapConstants';
import { useLocations } from '../../../shared/maps/providers/LocationsProvider';
import { useAuth } from '../../../auth/AuthProvider';
import {
  CategoryDTO,
  LocationRecommendationDTO,
  LocationPostDTO,
  MessagePostDTO,
  ResponseMessagePostDTO,
  Location,
} from '../../../shared/maps/Interfaces';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import AddLocationModal from '../../../shared/maps/components/AddLocationModal';
import {
  fetchLocationsByBounds,
  fetchRecommendedLocationsByBounds,
  MapBounds,
} from '../../../shared/maps/services/LocationsApiService';
import { fetchCategories } from '../../../shared/maps/services/CategoriesApiService';
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
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [recommendedLocations, setRecommendedLocations] = useState<
    LocationRecommendationDTO[]
  >([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);
  const [animationStates, setAnimationStates] =
    useState<LocationAnimationState>({});
  const [focusedRecommendationId, setFocusedRecommendationId] = useState<
    number | null
  >(null);
  const [focusRequestKey, setFocusRequestKey] = useState(0);

  // Load initial locations on mount - only once when user is available
  useEffect(() => {
    if (user?.id && !isInitialLoadDone) {
      refreshLocations(true);
      setIsInitialLoadDone(true);
    }
  }, [user?.id, isInitialLoadDone, refreshLocations]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchCategories(true);
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    })();
  }, []);

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
        setRecommendedLocations([]);
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

        if (user?.id) {
          setIsLoadingRecommendations(true);
          const recommendations = await fetchRecommendedLocationsByBounds(
            bounds,
            user.id,
            8
          );
          setRecommendedLocations(recommendations);
          setIsLoadingRecommendations(false);
        }

        // Fetch events for zoom >= CITY
        const events = await fetchEventsByBounds(bounds, true);
        setVisibleEvents(events);
      } catch (error) {
        console.error('Failed to fetch locations by bounds:', error);
        setIsLoadingRecommendations(false);
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

        if (user?.id) {
          setIsLoadingRecommendations(true);
          const recommendations = await fetchRecommendedLocationsByBounds(
            lastBounds,
            user.id,
            8
          );
          setRecommendedLocations(recommendations);
          setIsLoadingRecommendations(false);
        }
      } catch (err) {
        console.error(
          'Failed to fetch locations by bounds (type change):',
          err
        );
        setIsLoadingRecommendations(false);
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
    const createdLocation = await addLocation(location);

    setAnimationStates((states) => ({
      ...states,
      [createdLocation.id]: 'new',
    }));
    setTimeout(() => {
      setAnimationStates((states) => ({
        ...states,
        [createdLocation.id]: null,
      }));
    }, 900);

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
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gap: '12px',
            alignItems: 'start',
          }}
        >
          <div>
            <div style={{ width: 260, marginBottom: 8 }}>
              <Autocomplete
                size="small"
                options={['None', ...categories.map((c) => c.name)]}
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
              animationStates={animationStates}
              focusLocationId={focusedRecommendationId}
              focusRequestKey={focusRequestKey}
            />
          </div>

          <aside
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              padding: '12px',
              backgroundColor: '#fff',
              minHeight: '240px',
              maxHeight: 'calc(100vh - 220px)',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 8, fontSize: '1rem' }}>
              Recommended for you
            </h3>

            {isLoadingRecommendations && (
              <p style={{ margin: 0, color: '#6b7280' }}>Loading…</p>
            )}

            {!isLoadingRecommendations && recommendedLocations.length === 0 && (
              <p style={{ margin: 0, color: '#6b7280' }}>
                No recommendations in this area yet.
              </p>
            )}

            {!isLoadingRecommendations &&
              recommendedLocations.map((rec, index) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => {
                    setFocusedRecommendationId(rec.id);
                    setFocusRequestKey((current) => current + 1);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    padding: '10px',
                    marginTop: index === 0 ? 0 : 10,
                    cursor: 'pointer',
                    background:
                      focusedRecommendationId === rec.id
                        ? 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)'
                        : '#ffffff',
                    boxShadow:
                      focusedRecommendationId === rec.id
                        ? '0 4px 12px rgba(59,130,246,0.15)'
                        : '0 2px 8px rgba(15,23,42,0.06)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: '#111827',
                        maxWidth: '80%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {rec.name}
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#1d4ed8',
                        backgroundColor: '#dbeafe',
                        borderRadius: 9999,
                        padding: '2px 8px',
                      }}
                    >
                      #{index + 1}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: '#4b5563',
                      marginBottom: 6,
                    }}
                  >
                    {rec.category} · {rec.likesCount} likes · score {rec.score}
                  </div>

                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#374151',
                      lineHeight: 1.35,
                    }}
                  >
                    {rec.reason}
                  </div>
                </button>
              ))}
          </aside>
        </div>
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
