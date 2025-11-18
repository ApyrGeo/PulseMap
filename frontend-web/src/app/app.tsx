import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LocationPage from '../users/regular/UserLocationsPage';
import { LocationsProvider } from '../locations/LocationsProvider';
import { AuthProvider } from '../auth/AuthProvider';
import OwnerLocationsPage from '../users/owner/OwnerLocationsPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationsProvider>
          <Routes>
            <Route path="/owner/map" element={<OwnerLocationsPage />} />
            <Route path="/map" element={<LocationPage />} />
            <Route path="/" element={<Navigate to="/map" />} />
          </Routes>
        </LocationsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
