import UserMapComponent from './components/UserMapComponent';
import '../../shared/maps/LocationsPage.css';
import TipCard from '../../shared/components/TipCard';
import { useTranslation } from 'react-i18next';

const UserLocationsPage = () => {
  const { t } = useTranslation();
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ position: 'absolute', top: 70, left: 16, zIndex: 800, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <TipCard id="user-map-zoom" message={t('tips.userMapZoom')} />
        <TipCard id="user-map-recs" message={t('tips.userMapRecs')} />
      </div>
      <UserMapComponent />
    </div>
  );
};

export default UserLocationsPage;
