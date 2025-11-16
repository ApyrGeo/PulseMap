import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LocationPage from '../locations/LocationsPage';
import { LocationsProvider } from '../locations/LocationsProvider';
import { AuthProvider } from '../auth/AuthProvider';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LocationsProvider>
          <Routes>
            <Route path="/map" element={<LocationPage />} />
            <Route path="/" element={<Navigate to="/map" />} />
          </Routes>
        </LocationsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
