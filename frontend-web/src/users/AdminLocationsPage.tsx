import AdminMapComponent from '../locations/components/admin/AdminMapComponent';

const AdminLocationsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Admin Panel - PulseMap
        </h1>
        <p className="text-gray-600 mt-2">
          Manage all locations across the platform
        </p>
      </header>
      <AdminMapComponent />
    </div>
  );
};

export default AdminLocationsPage;
