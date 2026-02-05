import OwnerMapComponent from '../locations/components/owner/OwnerMapComponent';
import './LocationsPage.css';

const OwnerLocationsPage = () => {
  return (
    <div className="locations-page">
      <header className="locations-header">
        <h1 className="locations-title">PulseMap Locations</h1>
      </header>
      <OwnerMapComponent />
    </div>
  );
};

export default OwnerLocationsPage;
