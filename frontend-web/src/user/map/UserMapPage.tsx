import UserMapComponent from './components/UserMapComponent';
import '../../shared/maps/LocationsPage.css';

const UserLocationsPage = () => {
  return (
    <div className="locations-page">
      <UserMapComponent />
    </div>
  );
};

export default UserLocationsPage;
