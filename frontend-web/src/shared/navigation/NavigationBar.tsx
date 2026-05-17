import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { Role } from '../../auth/Interfaces';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n/index';
import BubbleMenu from '../components/BubbleMenu/BubbleMenu';
import './NavigationBar.css';

const UserNavigationBar = () => {
  const { isAuthenticated, user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const { t, i18n: i18nInstance } = useTranslation();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/', { replace: true });
  };

  const isAdmin = user?.role === Role.Admin;

  const linkClass = (path: string) =>
    `navigation-link${pathname === path ? ' navigation-link--active' : ''}`;

  return (
    <nav className="navigation-bar navigation-bar--glass">
      <div className="navigation-container">
        <Link to="/" className="navigation-logo">
          PulseMap
        </Link>

        <div className="navigation-center">
          {isAuthenticated && (
            <Link to={isAdmin ? '/admin/map' : '/map'} className={linkClass(isAdmin ? '/admin/map' : '/map')}>
              {t('nav.map')}
            </Link>
          )}

          {isAuthenticated && user?.role === Role.User && (
            <>
              <Link to="/owner/map" className={linkClass('/owner/map')}>
                {t('nav.myLocations')}
              </Link>
              <Link to="/user/statistics" className={linkClass('/user/statistics')}>
                {t('nav.statistics')}
              </Link>
            </>
          )}

          {isAuthenticated && user?.role === Role.Admin && (
            <>
              <Link to="/admin/statistics" className={linkClass('/admin/statistics')}>
                {t('nav.statistics')}
              </Link>
              <Link to="/admin/settings" className={linkClass('/admin/settings')}>
                {t('nav.settings')}
              </Link>
            </>
          )}
        </div>

        <div className="navigation-actions">
          <BubbleMenu
            logo={<span className="lang-globe">🌐</span>}
            menuBg="#1A1A2E"
            menuContentColor="#22C55E"
            items={[
              { label: 'RO', onClick: () => setLanguage('ro'), hoverStyles: { bgColor: '#22C55E', textColor: '#fff' } },
              { label: 'EN', onClick: () => setLanguage('en'), hoverStyles: { bgColor: '#22C55E', textColor: '#fff' } },
            ]}
          />

          {!isAuthenticated ? (
            <Link to="/login" className="navigation-login-button">
              {t('nav.login')}
            </Link>
          ) : (
            <button onClick={handleLogout} className="navigation-logout-button">
              {t('nav.logout')}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default UserNavigationBar;
