import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LocationsProvider } from '../shared/maps/providers/LocationsProvider';
import { AuthProvider, useAuth } from '../auth/AuthProvider';
import OwnerMapPage from '../owner/map/OwnerMapPage';
import AdminMapPage from '../admin/map/AdminMapPage';
import UserMapPage from '../user/map/UserMapPage';
import LoginPage from '../auth/LoginPage';
import RegisterPage from '../auth/RegisterPage';
import { Toaster } from 'react-hot-toast';
import { Role } from '../auth/Interfaces';
import { AdminRoutes } from '../auth/routes/AdminRoutes';
import { UserRoutes } from '../auth/routes/UserRoutes';
import NavigationBar from '../shared/navigation/NavigationBar';
import StatisticsPage from '../admin/statistics/StatisticsPage';
import AdminSettingsPage from '../admin/settings/AdminSettingsPage';
import UserStatisticsPage from '../user/statistics/UserStatisticsPage';

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
        <Route path="/admin/map" element={<AdminMapPage />} />
        <Route path="/admin/statistics" element={<StatisticsPage />} />
        <Route path="/admin/events" element={<Navigate to="/admin/settings" replace />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
      </Route>

      <Route element={<UserRoutes />}>
        <Route path="/map" element={<UserMapPage />} />
        <Route path="/user/statistics" element={<UserStatisticsPage />} />
      </Route>

      <Route path="/owner" element={<UserRoutes />}>
        <Route path="map" element={<OwnerMapPage />} />
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

      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to={defaultPath} replace />
          ) : (
            <RegisterPage />
          )
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
