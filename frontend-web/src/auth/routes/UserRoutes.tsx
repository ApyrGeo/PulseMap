import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthProvider';
import { Role } from '../Interfaces';

export const UserRoutes = () => {
  const { isAuthenticated, user } = useAuth();
  return isAuthenticated && user?.role === Role.User ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
};
