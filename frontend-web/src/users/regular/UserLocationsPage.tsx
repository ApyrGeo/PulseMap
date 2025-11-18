import UserMapComponent from './UserMapComponent';

const UserLocationsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">PulseMap Locations</h1>
      </header>
      <UserMapComponent />
    </div>
  );
};

export default UserLocationsPage;
