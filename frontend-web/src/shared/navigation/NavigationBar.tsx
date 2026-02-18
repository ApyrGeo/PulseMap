import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { Role } from '../../auth/Interfaces';
import './NavigationBar.css';

const UserNavigationBar = () => {
  const { isAuthenticated, user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
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
            <Link to="/owner/map" className="navigation-link">
              My Location
            </Link>
          )}

          {isAuthenticated && user?.role === Role.Admin && (
            <>
              <Link to="/admin/statistics" className="navigation-link">
                Admin Panel
              </Link>
              <Link to="/admin/events" className="navigation-link">
                Events
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
