import { Location } from '../../Interfaces';
import './AdminLocationPopup.css';

interface AdminLocationPopupProps {
  location: Location;
}

const AdminLocationPopup = ({ location }: AdminLocationPopupProps) => {
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="admin-popup-container">
      <h3 className="admin-popup-title">{location.name}</h3>

      {location.description && (
        <p className="admin-popup-description">{location.description}</p>
      )}

      <div className="admin-popup-details">
        <div className="admin-popup-row">
          <span className="admin-popup-label">Status:</span>
          <span
            className={`admin-popup-status ${
              location.isExpired ? 'expired' : 'active'
            }`}
          >
            {location.isExpired ? 'Expired' : 'Active'}
          </span>
        </div>

        <div className="admin-popup-row">
          <span className="admin-popup-label">Category:</span>
          <span className="admin-popup-value">{location.category}</span>
        </div>

        <div className="admin-popup-row">
          <span className="admin-popup-label">Creator:</span>
          <span className="admin-popup-value">{location.creator.username}</span>
        </div>

        {location.isExpired ? (
          <div className="admin-popup-row">
            <span className="admin-popup-label">Expired:</span>
            <span className="admin-popup-value">
              {formatDateTime(location.expiresAt)}
            </span>
          </div>
        ) : (
          <div className="admin-popup-row">
            <span className="admin-popup-label">Expires:</span>
            <span
              className={`admin-popup-value ${
                location.isExpired ? 'admin-popup-expired-text' : ''
              }`}
            >
              {formatDateTime(location.expiresAt)}
            </span>
          </div>
        )}

        <div className="admin-popup-divider">
          <div className="admin-popup-row">
            <span className="admin-popup-label">Comments:</span>
            <span className="admin-popup-value">
              {location.messages.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLocationPopup;
