import { useAuth } from '../../auth/AuthProvider';
import { useLocations } from '../../shared/maps/providers/LocationsProvider';
import LocationsListView from './components/LocationsListView';
import '../../shared/maps/LocationsPage.css';
import TipCard from '../../shared/components/TipCard';
import { useTranslation } from 'react-i18next';

const OwnerMapPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
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
      <div style={{ marginBottom: 12 }}>
        <TipCard id="user-my-locations" message={t('tips.userMyLocations')} />
      </div>
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
