import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Role } from '../auth/Interfaces';

const UserNavigationBar = () => {
  const { isAuthenticated, user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate('/login', { replace: true });
  };

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold text-gray-900">
          PulseMap
        </Link>

        <div className="flex items-center space-x-3">
          <Link to="/map" className="text-sm text-gray-700 hover:text-gray-900">
            Map
          </Link>

          {isAuthenticated && user?.role === Role.User && (
            <Link
              to="/owner/map"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              My Location
            </Link>
          )}

          {isAuthenticated && user?.role === Role.Admin && (
            <Link
              to="/admin/map"
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Admin Panel
            </Link>
          )}

          {!isAuthenticated ? (
            <Link
              to="/login"
              className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Login
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default UserNavigationBar;
