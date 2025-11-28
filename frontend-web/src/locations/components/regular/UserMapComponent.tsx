import { useEffect, useState } from 'react';
import LeafletMap from '../LeafletMap';
import { useLocations } from '../LocationsProvider';
import {
  LocationPostDTO,
  MessagePostDTO,
  ResponseMessagePostDTO,
} from '../../Interfaces';
import AddLocationModal from '../AddLocationModal';

const UserMapComponent = () => {
  const {
    activeLocations,
    refreshLocations,
    addLocation,
    addCommentToLocation,
    addResponseToMessage,
  } = useLocations();

  useEffect(() => {
    refreshLocations(true);
  }, []);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const handleMapClick = (lat: number, lng: number) => {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Locations Map</h1>
        <p className="text-gray-600 mt-2">
          Click on the map to add a location (1 day duration by default)
        </p>
      </header>

      <div className="bg-white rounded-lg shadow-lg p-4">
        <LeafletMap
          locations={activeLocations}
          onMapClick={handleMapClick}
          onAddComment={handleAddComment}
          onAddResponse={handleAddResponse}
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
          isOwner={false}
        />
      )}
    </div>
  );
};

export default UserMapComponent;
