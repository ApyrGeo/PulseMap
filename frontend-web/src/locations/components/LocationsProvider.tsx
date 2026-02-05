import {
  createContext,
  useContext,
  useState,
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
  unlikeLocationAPI,
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
} from '../Interfaces';
import { addComment, addResponse } from '../services/MessagesApiService';
import { LocationWsService, PayloadEntityType } from '../services/WsService';
import { useAuth } from '../../auth/AuthProvider';

interface LocationsContextType {
  locations: Location[];
  ownedLocations: Location[];
  activeLocations: Location[];
  allLocations: Location[];
  refreshLocations: (activeOnly?: boolean) => Promise<void>;
  addLocation: (location: LocationPostDTO) => Promise<void>;
  addCommentToLocation: (message: MessagePostDTO) => Promise<void>;
  addResponseToMessage: (message: ResponseMessagePostDTO) => Promise<void>;
  updateLocationById: (id: number, data: LocationPutDTO) => Promise<void>;
  deleteLocationById: (id: number) => Promise<void>;
  expireLocationById: (id: number) => Promise<void>;
  extendLocationById: (id: number) => Promise<void>;
  likeLocation: (locationId: number) => Promise<void>;
  unlikeLocation: (locationId: number) => Promise<void>;
}

const LocationsContext = createContext<LocationsContextType | undefined>(
  undefined
);

export const LocationsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [, setIsLoading] = useState(false);
  const [wsService] = useState(
    () => new LocationWsService('wss://localhost:7215/ws')
  );

  const handleLocationCreated = useCallback((location: Location) => {
    setLocations((prev) => {
      if (prev.find((loc) => loc.id === location.id)) {
        return prev;
      }
      return [...prev, location];
    });
  }, []);

  const handleLocationUpdated = useCallback((updated: Location) => {
    setLocations((prev) => {
      const exists = prev.some((loc) => loc.id === updated.id);

      const mergeFromExisting = (loc: Location): Location => {
        return {
          ...loc,
          ...updated,
          messages: updated.messages ?? loc.messages ?? [],
          likesCount:
            updated.likesCount !== undefined
              ? updated.likesCount
              : (loc as any).likeCount ?? (loc as any).likesCount ?? 0,
        };
      };

      if (exists) {
        return prev.map((loc) =>
          loc.id === updated.id ? mergeFromExisting(loc) : loc
        );
      }

      if (updated.isExpired) return prev;

      const newLoc: Location = {
        ...(updated as Partial<Location>),
        messages: updated.messages ?? [],
        likesCount: updated.likesCount ?? (updated as any).likesCount ?? 0,
        isLikedByCurrentUser: updated.isLikedByCurrentUser ?? false,
      } as Location;

      return [...prev, newLoc];
    });
  }, []);

  const handleLocationDeleted = useCallback((locationId: number) => {
    setLocations((prev) => prev.filter((loc) => loc.id !== locationId));
  }, []);

  const handleMessageCreated = useCallback((message: Message) => {
    setLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== message.locationId) return loc;

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

            // avoid duplicate responses
            const exists = (msg.responses || []).some(
              (r) => r.id === response.id
            );
            if (exists) return msg;

            return { ...msg, responses: [...(msg.responses || []), response] };
          }),
        };
      })
    );
  }, []);

  useEffect(() => {
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

  const refreshLocations = useCallback(async (activeOnly = true) => {
    setIsLoading(true);
    try {
      const data = await fetchLocations(activeOnly);
      setLocations(data);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addLocation = useCallback(async (location: LocationPostDTO) => {
    setIsLoading(true);
    try {
      await createLocation(location);
    } catch (error) {
      console.error('Failed to create location:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCommentToLocation = useCallback(async (message: MessagePostDTO) => {
    try {
      await addComment(message);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  }, []);

  const addResponseToMessage = useCallback(
    async (message: ResponseMessagePostDTO) => {
      try {
        await addResponse(message);
      } catch (error) {
        console.error('Failed to add response:', error);
      }
    },
    []
  );

  const updateLocationById = useCallback(
    async (id: number, data: LocationPutDTO) => {
      try {
        await updateLocation(id, data);
      } catch (error) {
        console.error('Failed to update location:', error);
        throw error;
      }
    },
    []
  );

  const deleteLocationById = useCallback(async (id: number) => {
    try {
      await deleteLocation(id);
    } catch (error) {
      console.error('Failed to delete location:', error);
      throw error;
    }
  }, []);

  const expireLocationById = useCallback(async (id: number) => {
    try {
      await expireLocation(id);
    } catch (error) {
      console.error('Failed to expire location:', error);
      throw error;
    }
  }, []);

  const extendLocationById = useCallback(async (id: number) => {
    try {
      await extendLocation(id);
    } catch (error) {
      console.error('Failed to extend location:', error);
      throw error;
    }
  }, []);

  const applyLikesSummary = useCallback((summary: LocationLikesSummaryDTO) => {
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === summary.id
          ? {
              ...loc,
              likesCount: summary.likesCount,
              isLikedByCurrentUser: summary.isNowLiked,
            }
          : loc
      )
    );
  }, []);

  const likeLocation = useCallback(
    async (locationId: number) => {
      if (!user?.id) return;
      try {
        const summary = await likeLocationAPI(locationId, user.id);
        applyLikesSummary(summary);
        // optionally broadcast or rely on WS instead
      } catch (error) {
        console.error('Failed to like location:', error);
        throw error;
      }
    },
    [applyLikesSummary, user]
  );

  const unlikeLocation = useCallback(
    async (locationId: number) => {
      if (!user?.id) return;
      try {
        const summary = await unlikeLocationAPI(locationId, user.id);
        applyLikesSummary(summary);
      } catch (error) {
        console.error('Failed to unlike location:', error);
        throw error;
      }
    },
    [applyLikesSummary, user]
  );

  const activeLocations = useMemo(
    () => locations.filter((loc) => !loc.isExpired),
    [locations]
  );

  const ownedLocations = useMemo(() => {
    return locations.filter((loc) => loc.owner?.id === user?.id);
  }, [locations, user?.id]);

  const allLocations = useMemo(() => locations, [locations]);

  return (
    <LocationsContext.Provider
      value={{
        locations,
        activeLocations,
        ownedLocations,
        allLocations,
        refreshLocations,
        addLocation,
        addCommentToLocation,
        addResponseToMessage,
        updateLocationById,
        deleteLocationById,
        expireLocationById,
        extendLocationById,
        likeLocation,
        unlikeLocation,
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
