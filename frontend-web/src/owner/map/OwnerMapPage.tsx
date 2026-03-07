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
