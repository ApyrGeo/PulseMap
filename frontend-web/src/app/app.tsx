import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LocationsProvider } from '../locations/components/LocationsProvider';
import { AuthProvider, useAuth } from '../auth/AuthProvider';
import OwnerLocationsPage from '../users/OwnerLocationsPage';
import AdminLocationsPage from '../users/AdminLocationsPage';
import UserLocationsPage from '../users/UserLocationsPage';
import LoginPage from '../auth/LoginPage';
import { Toaster } from 'react-hot-toast';
import { Role } from '../auth/Interfaces';
import { AdminRoutes } from '../auth/routes/AdminRoutes';
import { UserRoutes } from '../auth/routes/UserRoutes';
import NavigationBar from '../users/NavigationBar';

export function App() {
  return (
    <>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <LocationsProvider>
            <Layout />
          </LocationsProvider>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

function Layout() {
  return (
    <>
      <NavigationBar />
      <div className="container mx-auto px-4 py-6">
        <AppRoutes />
      </div>
    </>
  );
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  const defaultPath = user?.role === Role.Admin ? '/admin/map' : '/map';

  return (
    <Routes>
      <Route element={<AdminRoutes />}>
        {/* <Route path="/map" element={<Navigate to="/admin/map" replace />} /> */}
        <Route path="/admin/map" element={<AdminLocationsPage />} />
      </Route>

      <Route element={<UserRoutes />}>
        <Route path="/map" element={<UserLocationsPage />} />
      </Route>

      <Route path="/owner" element={<UserRoutes />}>
        <Route path="map" element={<OwnerLocationsPage />} />
      </Route>

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={defaultPath} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
