import AdminMapComponent from './components/AdminMapComponent';
import '../../shared/maps/LocationsPage.css';
import TipCard from '../../shared/components/TipCard';
import { useTranslation } from 'react-i18next';

const AdminLocationsPage = () => {
  const { t } = useTranslation();
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ position: 'absolute', top: 70, left: 16, zIndex: 800 }}>
        <TipCard id="admin-map-ctx" message={t('tips.adminMapCtx')} />
      </div>
      <AdminMapComponent />
    </div>
  );
};

export default AdminLocationsPage;
