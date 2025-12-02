import OwnerMapComponent from '../locations/components/owner/OwnerMapComponent';

const OwnerLocationsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">PulseMap Locations</h1>
      </header>
      <OwnerMapComponent />
    </div>
  );
};

export default OwnerLocationsPage;
