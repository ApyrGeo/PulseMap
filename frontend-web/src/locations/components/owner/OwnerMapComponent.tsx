import { useState, useEffect } from 'react';
import LeafletMap from '../LeafletMap';
import { useLocations } from '../LocationsProvider';
import { useAuth } from '../../../auth/AuthProvider';
import { Location, LocationPutDTO, LocationPostDTO } from '../../Interfaces';
import OwnerContextMenu from './OwnerContextMenu';
import EditLocationModal from '../EditLocationModal';
import AddLocationModal from '../AddLocationModal';

const OwnerMapComponent = () => {
  const { user } = useAuth();
  const {
    ownedLocations,
    refreshLocations,
    updateLocationById,
    deleteLocationById,
    addLocation,
  } = useLocations();

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

  useEffect(() => {
    refreshLocations(true); // Load active locations
  }, [refreshLocations]);

  const canAddLocation = !ownedLocations.some(
    (loc) => loc.owner?.id === user?.id
  );

  const handleMapClick = (lat: number, lng: number) => {
    if (!canAddLocation) {
      alert(
        'You can only have one location. Delete your existing location first.'
      );
      return;
    }
    setClickedCoords({ lat, lng });
    setAddModalOpen(true);
  };

  const handleAddSubmit = async (location: LocationPostDTO) => {
    if (!user) return;
    location.ownerId = user.id;
    await addLocation(location);
    setAddModalOpen(false);
    setClickedCoords(null);
  };

  const handleContextMenu = (e: React.MouseEvent, location: Location) => {
    e.preventDefault();

    if (location.owner?.id !== user?.id) {
      return;
    }
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
        <h1 className="text-3xl font-bold text-gray-800">My Location</h1>
        <p className="text-gray-600 mt-2">
          {canAddLocation
            ? 'Click to add your location (other locations shown in gray)'
            : 'Right-click your marker to edit or delete'}
        </p>
      </header>

      <div className="bg-white rounded-lg shadow-lg p-4">
        <LeafletMap
          locations={ownedLocations}
          onMapClick={handleMapClick}
          onContextMenu={handleContextMenu}
          currentUserId={user?.id}
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
          isOwner={true}
        />
      )}

      {contextMenu && (
        <OwnerContextMenu
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
