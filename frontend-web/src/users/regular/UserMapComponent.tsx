import LeafletMap from '../../locations/components/LeafletMap';
import { useLocations } from '../../locations/LocationsProvider';
import { LocationPostDTO } from '../../locations/Interfaces';
import { useAuth } from '../../auth/AuthProvider';

const UserMapComponent = () => {
  const { user } = useAuth();
  const { locations, addLocation, addCommentToLocation, addResponseToMessage } =
    useLocations();

  const handleMapClick = async (data: LocationPostDTO) => {
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

export default UserMapComponent;
