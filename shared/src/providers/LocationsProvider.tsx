import {
  createContext,
  useContext,
  useState,
  useRef,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import {
  fetchLocations,
  createLocation,
  deleteLocation,
  updateLocation,
  expireLocation,
  extendLocation,
  likeLocationAPI,
} from '../services/LocationsApiService';
import {
  Location,
  LocationPutDTO,
  LocationPostDTO,
  MessagePostDTO,
  ResponseMessagePostDTO,
  Message,
  ResponseMessage,
  LocationLikesSummaryDTO,
} from '../types/location';
import { addComment, addResponse } from '../services/MessagesApiService';
import { LocationWsService, PayloadEntityType } from '../services/WsService';
import { getInteractedLocationIds } from '../services/InteractionApiService';
import { useAuth } from './AuthProvider';
import { getWsUrl } from '../config/environment';

interface LocationsContextType {
  locations: Location[];
  ownedLocations: Location[];
  activeLocations: Location[];
  allLocations: Location[];
  interactedLocationIds: Set<number>;
  refreshLocations: (activeOnly?: boolean) => Promise<void>;
  addLocation: (location: LocationPostDTO) => Promise<Location>;
  addCommentToLocation: (message: MessagePostDTO) => Promise<void>;
  addResponseToMessage: (message: ResponseMessagePostDTO) => Promise<void>;
  updateLocationById: (id: number, data: LocationPutDTO) => Promise<void>;
  deleteLocationById: (id: number) => Promise<void>;
  expireLocationById: (id: number) => Promise<void>;
  extendLocationById: (id: number) => Promise<void>;
  likeLocation: (locationId: number) => Promise<void>;
  markAsInteracted: (locationId: number) => void;
}

const LocationsContext = createContext<LocationsContextType | undefined>(undefined);

export const LocationsProvider = ({ children }: { children: ReactNode }) => {
  const { user, tokenService } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const deletedLocationIds = useRef<Set<number>>(new Set());
  const [interactedLocationIds, setInteractedLocationIds] = useState<Set<number>>(new Set());
  const [wsService] = useState(() => new LocationWsService(getWsUrl()));

  useEffect(() => {
    if (!user?.id) return;
    getInteractedLocationIds(tokenService, user.id)
      .then((ids) => setInteractedLocationIds(new Set(ids)))
      .catch((err) => console.error('Failed to load interacted location ids:', err));
  }, [user?.id, tokenService]);

  const handleLocationCreated = useCallback((location: Location) => {
    setLocations((prev) => {
      if (prev.find((loc) => loc.id === location.id)) return prev;
      return [...prev, location];
    });
  }, []);

  const handleLocationUpdated = useCallback((updated: Location) => {
    setLocations((prev) => {
      const exists = prev.some((loc) => loc.id === updated.id);
      const mergeFromExisting = (loc: Location): Location => ({
        ...loc,
        ...updated,
        messages: updated.messages ?? loc.messages ?? [],
        likesCount:
          updated.likesCount !== undefined
            ? updated.likesCount
            : (loc as any).likesCount ?? 0,
      });

      if (exists) {
        return prev.map((loc) =>
          loc.id === updated.id ? mergeFromExisting(loc) : loc
        );
      }
      if (updated.isExpired) return prev;
      if (deletedLocationIds.current.has(updated.id)) return prev;
      return [...prev, { ...updated, messages: updated.messages ?? [] }];
    });
  }, []);

  const handleLocationDeleted = useCallback((locationId: number) => {
    deletedLocationIds.current.add(locationId);
    setLocations((prev) => prev.filter((loc) => loc.id !== locationId));
  }, []);

  const handleMessageCreated = useCallback((message: Message) => {
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== message.locationId) return loc;
        const msgData = message as any;
        if (msgData.parentMessageId !== undefined && msgData.parentMessageId !== null) return loc;
        const exists = (loc.messages || []).some((m) => m.id === message.id);
        if (exists) return loc;
        return { ...loc, messages: [...(loc.messages || []), message] };
      })
    );
  }, []);

  const handleResponseCreated = useCallback((response: ResponseMessage) => {
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== response.locationId) return loc;
        return {
          ...loc,
          messages: (loc.messages || []).map((msg) => {
            if (msg.id !== response.parentMessageId) return msg;
            const exists = (msg.responses || []).some((r) => r.id === response.id);
            if (exists) return msg;
            return { ...msg, responses: [...(msg.responses || []), response] };
          }),
        };
      })
    );
  }, []);

  useEffect(() => {
    wsService.clearAllHandlers();
    wsService.registerEntityHandlers(PayloadEntityType.Location, {
      onCreate: handleLocationCreated,
      onUpdate: handleLocationUpdated,
      onDelete: handleLocationDeleted,
    });
    wsService.registerEntityHandlers(PayloadEntityType.Message, {
      onCreate: handleMessageCreated,
    });
    wsService.registerEntityHandlers(PayloadEntityType.Response, {
      onCreate: handleResponseCreated,
    });
    wsService.connect();

    return () => {
      wsService.clearAllHandlers();
      wsService.disconnect();
    };
  }, [
    wsService,
    handleLocationCreated,
    handleLocationUpdated,
    handleLocationDeleted,
    handleMessageCreated,
    handleResponseCreated,
  ]);

  const refreshLocations = useCallback(
    async (activeOnly = true) => {
      try {
        const data = await fetchLocations(tokenService, activeOnly, user?.id);
        setLocations(data);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }
    },
    [tokenService, user?.id]
  );

  const addLocation = useCallback(
    async (location: LocationPostDTO) => {
      const created = await createLocation(tokenService, location);
      // Immediately reflect in local state so the map updates without waiting for WS.
      // handleLocationCreated's dedup check prevents a double-add if WS also fires.
      handleLocationCreated(created);
      return created;
    },
    [tokenService, handleLocationCreated]
  );

  const addCommentToLocation = useCallback(
    async (message: MessagePostDTO) => {
      try {
        await addComment(tokenService, message);
      } catch (error) {
        console.error('Failed to add comment:', error);
      }
    },
    [tokenService]
  );

  const addResponseToMessage = useCallback(
    async (message: ResponseMessagePostDTO) => {
      try {
        const createdResponse = await addResponse(tokenService, message);
        if (!createdResponse.sender && user) {
          handleResponseCreated({
            ...createdResponse,
            sender: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              username: user.username,
            },
          });
          return;
        }
        handleResponseCreated(createdResponse);
      } catch (error) {
        console.error('Failed to add response:', error);
      }
    },
    [tokenService, handleResponseCreated, user]
  );

  const updateLocationById = useCallback(
    async (id: number, data: LocationPutDTO) => {
      await updateLocation(tokenService, id, data);
    },
    [tokenService]
  );

  const deleteLocationById = useCallback(
    async (id: number) => {
      await deleteLocation(tokenService, id);
    },
    [tokenService]
  );

  const expireLocationById = useCallback(
    async (id: number) => {
      await expireLocation(tokenService, id);
    },
    [tokenService]
  );

  const extendLocationById = useCallback(
    async (id: number) => {
      await extendLocation(tokenService, id);
    },
    [tokenService]
  );

  const applyLikesSummary = useCallback((summary: LocationLikesSummaryDTO) => {
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === summary.id
          ? { ...loc, likesCount: summary.likesCount, isLikedByCurrentUser: summary.isNowLiked }
          : loc
      )
    );
  }, []);

  const likeLocation = useCallback(
    async (locationId: number) => {
      if (!user?.id) return;
      const summary = await likeLocationAPI(tokenService, locationId, user.id);
      applyLikesSummary(summary);
    },
    [tokenService, applyLikesSummary, user]
  );

  const markAsInteracted = useCallback((locationId: number) => {
    setInteractedLocationIds((prev) => {
      if (prev.has(locationId)) return prev;
      const next = new Set(prev);
      next.add(locationId);
      return next;
    });
  }, []);

  const activeLocations = useMemo(
    () => locations.filter((loc) => !loc.isExpired),
    [locations]
  );

  const ownedLocations = useMemo(
    () => locations.filter((loc) => loc.owner?.id === user?.id || loc.creator?.id === user?.id),
    [locations, user?.id]
  );

  const allLocations = useMemo(() => locations, [locations]);

  return (
    <LocationsContext.Provider
      value={{
        locations,
        activeLocations,
        ownedLocations,
        allLocations,
        interactedLocationIds,
        refreshLocations,
        addLocation,
        addCommentToLocation,
        addResponseToMessage,
        updateLocationById,
        deleteLocationById,
        expireLocationById,
        extendLocationById,
        likeLocation,
        markAsInteracted,
      }}
    >
      {children}
    </LocationsContext.Provider>
  );
};

export function useLocations() {
  const context = useContext(LocationsContext);
  if (!context) {
    throw new Error('useLocations must be used within LocationsProvider');
  }
  return context;
}
