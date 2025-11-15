import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { fetchLocations, createLocation } from './LocationsApiService';
import { Location } from './Interfaces';

interface LocationsContextType {
  locations: Location[];
  addLocation: (
    latitude: number,
    longitude: number,
    name: string,
    creatorId: number,
    description?: string
  ) => Promise<void>;
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

  async function addLocation(
    latitude: number,
    longitude: number,
    name: string,
    creatorId: number,
    description?: string
  ) {
    setIsLoading(true);
    try {
      const newLocation = await createLocation({
        latitude,
        longitude,
        name,
        description,
        creatorId,
      });
      setLocations((prev) => [...prev, newLocation]);
    } catch (error) {
      console.error('Failed to create location:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <LocationsContext.Provider value={{ locations, addLocation }}>
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
