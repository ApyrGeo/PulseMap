import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import {
  fetchLocations,
  createLocation,
  deleteLocation,
  updateLocation,
  expireLocation,
  extendLocation,
} from '../services/LocationsApiService';
import {
  Location,
  LocationPutDTO,
  LocationPostDTO,
  MessagePostDTO,
  ResponseMessagePostDTO,
} from '../Interfaces';
import { addComment, addResponse } from '../services/MessagesApiService';

interface LocationsContextType {
  locations: Location[];
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
}

const LocationsContext = createContext<LocationsContextType | undefined>(
  undefined
);

export const LocationsProvider = ({ children }: { children: ReactNode }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [, setIsLoading] = useState(false);

  const refreshLocations = useCallback(async (activeOnly = true) => {
    setIsLoading(true);
    try {
      const data = await fetchLocations(activeOnly);
      console.log('Raw data from API:', data);
      console.log(
        'Expired locations in data:',
        data.filter((loc) => loc.isExpired)
      );
      console.log(
        'Active locations in data:',
        data.filter((loc) => !loc.isExpired)
      );
      setLocations(data);
      console.log('Loaded locations:', data.length, 'activeOnly:', activeOnly);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addLocation = useCallback(async (location: LocationPostDTO) => {
    setIsLoading(true);
    try {
      const newLocation = await createLocation(location);
      setLocations((prev) => [...prev, newLocation]);
    } catch (error) {
      console.error('Failed to create location:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCommentToLocation = useCallback(async (message: MessagePostDTO) => {
    try {
      const newComment = await addComment(message);

      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === message.locationId
            ? { ...loc, messages: [...loc.messages, newComment] }
            : loc
        )
      );
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  }, []);

  const addResponseToMessage = useCallback(
    async (message: ResponseMessagePostDTO) => {
      try {
        const newResponse = await addResponse(message);

        setLocations((prev) =>
          prev.map((loc) =>
            loc.id === newResponse.locationId
              ? {
                  ...loc,
                  messages: loc.messages.map((comment) =>
                    comment.id === message.messageId
                      ? {
                          ...comment,
                          responses: [
                            ...(comment.responses || []),
                            newResponse,
                          ],
                        }
                      : comment
                  ),
                }
              : loc
          )
        );
      } catch (error) {
        console.error('Failed to add response:', error);
      }
    },
    []
  );

  const updateLocationById = useCallback(
    async (id: number, data: LocationPutDTO) => {
      try {
        const updatedLocation = await updateLocation(id, data);
        setLocations((prev) =>
          prev.map((loc) => (loc.id === id ? updatedLocation : loc))
        );
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
      setLocations((prev) => prev.filter((loc) => loc.id !== id));
    } catch (error) {
      console.error('Failed to delete location:', error);
      throw error;
    }
  }, []);

  const expireLocationById = useCallback(async (id: number) => {
    try {
      const updatedLocation = await expireLocation(id);
      // Update with the returned location from backend
      setLocations((prev) =>
        prev.map((loc) => (loc.id === id ? updatedLocation : loc))
      );
    } catch (error) {
      console.error('Failed to expire location:', error);
      throw error;
    }
  }, []);

  const extendLocationById = useCallback(async (id: number) => {
    try {
      const updatedLocation = await extendLocation(id);
      // Update with the returned location from backend
      setLocations((prev) =>
        prev.map((loc) => (loc.id === id ? updatedLocation : loc))
      );
    } catch (error) {
      console.error('Failed to extend location:', error);
      throw error;
    }
  }, []);

  const activeLocations = useMemo(
    () => locations.filter((loc) => !loc.isExpired),
    [locations]
  );

  const allLocations = useMemo(() => locations, [locations]);

  return (
    <LocationsContext.Provider
      value={{
        locations,
        activeLocations,
        allLocations,
        refreshLocations,
        addLocation,
        addCommentToLocation,
        addResponseToMessage,
        updateLocationById,
        deleteLocationById,
        expireLocationById,
        extendLocationById,
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
