import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Location } from '../../../shared/maps/Interfaces';
import { starLocation } from '../../../shared/maps/services/LocationsApiService';
import './AdminLocationPopup.css';

interface AdminLocationPopupProps {
  location: Location;
}

const AdminLocationPopup = ({ location }: AdminLocationPopupProps) => {
  const { t } = useTranslation();
  const [isStarred, setIsStarred] = useState(location.isStarred ?? false);
  const [starLoading, setStarLoading] = useState(false);

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggleStar = async () => {
    setStarLoading(true);
    try {
      const updated = await starLocation(location.id);
      setIsStarred(updated.isStarred ?? false);
    } catch (e) {
      console.error('Failed to toggle star', e);
    } finally {
      setStarLoading(false);
    }
  };

  return (
    <div className="admin-popup-container">
      <h3 className="admin-popup-title">{location.name}</h3>

      {location.description && (
        <p className="admin-popup-description">{location.description}</p>
      )}

      <div className="admin-popup-details">
        <div className="admin-popup-row">
          <span className="admin-popup-label">{t('adminPopup.status')}:</span>
          <span
            className={`admin-popup-status ${
              location.isExpired ? 'expired' : 'active'
            }`}
          >
            {location.isExpired ? t('adminPopup.expired') : t('adminPopup.active')}
          </span>
        </div>

        <div className="admin-popup-row">
          <span className="admin-popup-label">{t('adminPopup.category')}:</span>
          <span className="admin-popup-value">{location.category}</span>
        </div>

        <div className="admin-popup-row">
          <span className="admin-popup-label">{t('adminPopup.creator')}:</span>
          <span className="admin-popup-value">{location.creator.username}</span>
        </div>

        {location.event && (
          <div className={`admin-popup-event-box ${location.event.requiresReview ? 'requires-review' : ''}`}>
            <div className="admin-popup-event-title">
              <img src="/icons/target.png" style={{ width: 14, height: 14, marginRight: 4, verticalAlign: 'middle' }} alt="" />
              {t('adminPopup.partOfEvent')}
            </div>
            <div className="admin-popup-event-name">
              {location.event.name}
              {location.event.requiresReview && (
                <img src="/icons/warning.png" style={{ width: 12, height: 12, marginLeft: 4, verticalAlign: 'middle' }} alt="" />
              )}
            </div>
            {location.eventAssignmentConfidence && (
              <div className="admin-popup-event-confidence">
                {t('adminPopup.matchConfidence')}: {(location.eventAssignmentConfidence * 100).toFixed(0)}%
              </div>
            )}
            {location.event.requiresReview && (
              <div className="admin-popup-event-warning">
                {t('adminPopup.requiresReview')}
              </div>
            )}
          </div>
        )}

        {location.isExpired ? (
          <div className="admin-popup-row">
            <span className="admin-popup-label">{t('adminPopup.expiredAt')}:</span>
            <span className="admin-popup-value">
              {formatDateTime(location.expiresAt)}
            </span>
          </div>
        ) : (
          <div className="admin-popup-row">
            <span className="admin-popup-label">{t('adminPopup.expiresAt')}:</span>
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
            <span className="admin-popup-label">{t('adminPopup.comments')}:</span>
            <span className="admin-popup-value">
              {location.messages.length}
            </span>
          </div>
        </div>

        {location.isExpired && (
          <button
            className={`admin-popup-star-btn ${isStarred ? 'starred' : ''}`}
            onClick={handleToggleStar}
            disabled={starLoading}
          >
            {isStarred ? t('adminPopup.starred') : t('adminPopup.starLocation')}
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminLocationPopup;
