import LeafletMap from './LeafletMap';
import { useLocations } from '../LocationsProvider';
import { LocationCategory } from '../Interfaces';
import { useAuth } from '../../auth/AuthProvider';

const MapComponent = () => {
  const { user } = useAuth();
  const { locations, addLocation, addCommentToLocation, addResponseToMessage } =
    useLocations();

  const handleMapClick = async (data: {
    latitude: number;
    longitude: number;
    name: string;
    category: LocationCategory;
    description?: string;
  }) => {
    await addLocation({ ...data, creatorId: user.id });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <LeafletMap
        locations={locations}
        onMapClick={handleMapClick}
        onAddComment={addCommentToLocation}
        onAddResponse={addResponseToMessage}
      />
    </div>
  );
};

export default MapComponent;
