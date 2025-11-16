import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { fetchLocations, createLocation } from './services/LocationsApiService';
import {
  Location,
  LocationPostDTO,
  MessagePostDTO,
  ResponseMessagePostDTO,
} from './Interfaces';
import { addComment, addResponse } from './services/MessagesApiService';

interface LocationsContextType {
  locations: Location[];
  addLocation: (location: LocationPostDTO) => Promise<void>;
  addCommentToLocation: (message: MessagePostDTO) => Promise<void>;
  addResponseToMessage: (message: ResponseMessagePostDTO) => Promise<void>;
}

const LocationsContext = createContext<LocationsContextType | undefined>(
  undefined
);

export const LocationsProvider = ({ children }: { children: ReactNode }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [, setIsLoading] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  async function loadLocations() {
    try {
      const data = await fetchLocations();
      setLocations(data);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  }

  async function addLocation(location: LocationPostDTO) {
    setIsLoading(true);
    try {
      const newLocation = await createLocation(location);
      setLocations((prev) => [...prev, newLocation]);
    } catch (error) {
      console.error('Failed to create location:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function addCommentToLocation(message: MessagePostDTO) {
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
  }

  async function addResponseToMessage(message: ResponseMessagePostDTO) {
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
                        responses: [...(comment.responses || []), newResponse],
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
  }

  return (
    <LocationsContext.Provider
      value={{
        locations,
        addLocation,
        addCommentToLocation,
        addResponseToMessage,
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
