import AdminMapComponent from '../locations/components/admin/AdminMapComponent';
import './LocationsPage.css';

const AdminLocationsPage = () => {
  return (
    <div className="locations-page">
      <header className="locations-header">
        <h1 className="locations-title">Admin Panel - PulseMap</h1>
        <p className="locations-subtitle">
          Manage all locations across the platform
        </p>
      </header>
      <AdminMapComponent />
    </div>
  );
};

export default AdminLocationsPage;
