import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LocationsProvider } from '../locations/components/LocationsProvider';
import { AuthProvider } from '../auth/AuthProvider';
import OwnerLocationsPage from '../users/OwnerLocationsPage';
import AdminLocationsPage from '../users/AdminLocationsPage';
import UserLocationsPage from '../users/UserLocationsPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationsProvider>
          <Routes>
            <Route path="/admin/map" element={<AdminLocationsPage />} />
            <Route path="/owner/map" element={<OwnerLocationsPage />} />
            <Route path="/map" element={<UserLocationsPage />} />
            <Route path="/" element={<Navigate to="/map" />} />
          </Routes>
        </LocationsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
