import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { Role } from '../../auth/Interfaces';
import './NavigationBar.css';

const UserNavigationBar = () => {
  const { isAuthenticated, user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="navigation-bar">
      <div className="navigation-container">
        <Link to="/" className="navigation-logo">
          PulseMap
        </Link>

        <div className="navigation-links">
          <Link to="/map" className="navigation-link">
            Map
          </Link>

          {isAuthenticated && user?.role === Role.User && (
            <>
              <Link to="/owner/map" className="navigation-link">
                My Locations
              </Link>
              <Link to="/user/statistics" className="navigation-link">
                Statistics
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === Role.Admin && (
            <>
              <Link to="/admin/statistics" className="navigation-link">
                Statistics
              </Link>
              <Link to="/admin/settings" className="navigation-link">
                Settings
              </Link>
            </>
          )}

          {!isAuthenticated ? (
            <Link to="/login" className="navigation-login-button">
              Login
            </Link>
          ) : (
            <button onClick={handleLogout} className="navigation-logout-button">
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default UserNavigationBar;
