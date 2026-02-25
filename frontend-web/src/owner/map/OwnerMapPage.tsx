import { useAuth } from '../../auth/AuthProvider';
import { useLocations } from '../../shared/maps/providers/LocationsProvider';
import LocationsListView from './components/LocationsListView';
import '../../shared/maps/LocationsPage.css';

const OwnerMapPage = () => {
  const { user } = useAuth();
  const { 
    allLocations, 
    updateLocationById, 
    deleteLocationById,
    confirmLocationEvent,
    rejectLocationEvent,
  } = useLocations();

  if (!user) return null;

  return (
    <div className="locations-page">
      <header className="locations-header">
        <h1 className="locations-title">My Locations</h1>
        <p className="locations-subtitle">
          Manage your owned location and all locations you've created
        </p>
      </header>
      <LocationsListView
        locations={allLocations}
        currentUserId={user.id}
        onUpdate={updateLocationById}
        onDelete={deleteLocationById}
        onConfirmEvent={confirmLocationEvent}
        onRejectEvent={rejectLocationEvent}
      />
    </div>
  );
};

export default OwnerMapPage;
