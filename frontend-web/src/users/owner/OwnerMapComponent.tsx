import { useState, useMemo } from 'react';
import LeafletMap from '../../locations/components/LeafletMap';
import { useLocations } from '../../locations/LocationsProvider';
import { useAuth } from '../../auth/AuthProvider';
import {
  Location,
  LocationPutDTO,
  LocationPostDTO,
} from '../../locations/Interfaces';
import LocationContextMenu from '../../locations/components/LocationContextMenu';
import EditLocationModal from '../../locations/components/EditLocationModal';
import AddLocationModal from '../../locations/components/AddLocationModal';

const OwnerMapComponent = () => {
  const { user } = useAuth();
  const { locations, updateLocationById, deleteLocationById, addLocation } =
    useLocations();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    location: Location;
  } | null>(null);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const userLocations = useMemo(
    () => locations.filter((loc) => loc.creator.id === user?.id),
    [locations, user?.id]
  );

  const handleMapClick = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
    setAddModalOpen(true);
  };

  const handleAddSubmit = async (location: LocationPostDTO) => {
    await addLocation(location);
    setAddModalOpen(false);
    setClickedCoords(null);
  };

  const handleContextMenu = (e: React.MouseEvent, location: Location) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, location });
  };

  const handleEdit = () => {
    if (contextMenu) {
      setEditingLocation(contextMenu.location);
    }
  };

  const handleDelete = async () => {
    if (contextMenu) {
      if (window.confirm('Are you sure you want to delete this location?')) {
        try {
          await deleteLocationById(contextMenu.location.id);
        } catch {
          alert('Failed to delete location');
        }
      }
    }
  };

  const handleEditSubmit = async (data: LocationPutDTO) => {
    if (editingLocation) {
      try {
        await updateLocationById(editingLocation.id, data);
        setEditingLocation(null);
      } catch {
        alert('Failed to update location');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Locations</h1>
        <p className="text-gray-600 mt-2">
          Click to add • Right-click marker to edit or delete
        </p>
      </header>

      <div className="bg-white rounded-lg shadow-lg p-4">
        <LeafletMap
          locations={userLocations}
          onMapClick={handleMapClick}
          onContextMenu={handleContextMenu}
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
        />
      )}

      {contextMenu && (
        <LocationContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={() => setContextMenu(null)}
        />
      )}

      {editingLocation && (
        <EditLocationModal
          isOpen={true}
          location={editingLocation}
          onClose={() => setEditingLocation(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
};

export default OwnerMapComponent;
