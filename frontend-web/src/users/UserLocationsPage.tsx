import UserMapComponent from '../locations/components/regular/UserMapComponent';
import './LocationsPage.css';

const UserLocationsPage = () => {
  return (
    <div className="locations-page">
      <header className="locations-header">
        <h1 className="locations-title">PulseMap Locations</h1>
      </header>
      <UserMapComponent />
    </div>
  );
};

export default UserLocationsPage;
