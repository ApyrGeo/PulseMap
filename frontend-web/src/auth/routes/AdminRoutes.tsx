import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import { Role } from '../Interfaces';

export const AdminRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return isAuthenticated && user?.role === Role.Admin ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};
