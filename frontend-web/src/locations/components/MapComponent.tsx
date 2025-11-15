import LeafletMap from './LeafletMap';
import { useLocations } from '../LocationsProvider';

const USER_ID = 1; // Placeholder for the current user's ID

const MapComponent = () => {
  const { locations, addLocation } = useLocations();

  const handleMapClick = async (data: {
    latitude: number;
    longitude: number;
    name: string;
    description?: string;
  }) => {
    await addLocation(
      data.latitude,
      data.longitude,
      data.name,
      USER_ID,
      data.description
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <LeafletMap locations={locations} onMapClick={handleMapClick} />
    </div>
  );
};

export default MapComponent;
