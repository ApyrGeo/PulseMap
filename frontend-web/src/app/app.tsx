import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LocationPage from '../locations/LocationsPage';
import { LocationsProvider } from '../locations/LocationsProvider';

export function App() {
  return (
    <BrowserRouter>
      <LocationsProvider>
        <Routes>
          <Route path="/map" element={<LocationPage />} />
          <Route path="/" element={<Navigate to="/map" />} />
        </Routes>
      </LocationsProvider>
    </BrowserRouter>
  );
}

export default App;
