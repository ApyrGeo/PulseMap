import AdminMapComponent from './components/AdminMapComponent';
import '../../shared/maps/LocationsPage.css';

const AdminLocationsPage = () => {
  return (
    <div className="locations-page">
      <AdminMapComponent />
    </div>
  );
};

export default AdminLocationsPage;
