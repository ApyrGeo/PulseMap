import { useState, useEffect } from 'react';
import LeafletMap from '../LeafletMap';
import { useLocations } from '../LocationsProvider';
import { Location } from '../../Interfaces';
import AdminContextMenu from './AdminContextMenu';

const AdminMapComponent = () => {
  const {
    allLocations,
    refreshLocations,
    deleteLocationById,
    expireLocationById,
    extendLocationById,
  } = useLocations();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    location: Location;
  } | null>(null);

  useEffect(() => {
    refreshLocations(false); // Load all locations (active + expired)
  }, [refreshLocations]);

  const handleContextMenu = (e: React.MouseEvent, location: Location) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, location });
  };

  const handleExpire = async () => {
    if (contextMenu) {
      if (
        window.confirm(
          'Are you sure you want to expire this location immediately?'
        )
      ) {
        try {
          await expireLocationById(contextMenu.location.id);
        } catch {
          alert('Failed to expire location');
        }
      }
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

  const handleExtend = async () => {
    if (contextMenu) {
      if (
        window.confirm(
          'Are you sure you want to extend this location expiration?'
        )
      ) {
        try {
          await extendLocationById(contextMenu.location.id);
        } catch {
          alert('Failed to extend location');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
        <p className="text-gray-600 mt-2">
          Right-click on a marker to manage locations
        </p>
      </header>

      <div className="bg-white rounded-lg shadow-lg p-4">
        <LeafletMap
          locations={allLocations}
          onContextMenu={handleContextMenu}
          isAdmin={true}
        />
      </div>

      {contextMenu && (
        <AdminContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isExpired={contextMenu.location.isExpired}
          onExpire={handleExpire}
          onDelete={handleDelete}
          onExtend={handleExtend}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default AdminMapComponent;
