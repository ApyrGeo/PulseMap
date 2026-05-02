import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { analyzeAndClusterEvents, EventClusteringResultDTO } from '../services/EventsApiService';
import './EventDetectionPanel.css';

const EventDetectionPanel = () => {
  const { t } = useTranslation();
  const [maxDistance, setMaxDistance] = useState(100);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EventClusteringResultDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzeAndClusterEvents(maxDistance);
      setResult(data);
    } catch (err) {
      setError(t('eventPanel.error'));
      console.error('Error analyzing events:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-detection-panel">
      <div className="event-detection-header">
        <h2>{t('eventPanel.title')}</h2>
        <p className="event-detection-subtitle">
          {t('eventPanel.subtitle')}
        </p>
      </div>

      <div className="event-detection-controls">
        <div className="control-group">
          <label htmlFor="maxDistance">{t('eventPanel.maxDistance')}</label>
          <input
            id="maxDistance"
            type="number"
            min="10"
            max="1000"
            step="10"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            disabled={loading}
          />
        </div>

        <button
          className="analyze-button"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? t('eventPanel.analyzing') : t('eventPanel.detect')}
        </button>
      </div>

      {error && (
        <div className="event-detection-error">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="event-detection-results">
          <div className="result-summary">
            <h3>{t('eventPanel.resultsTitle')}</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">{t('eventPanel.eventsCreated')}</span>
                <span className="stat-value">{result.eventsCreated.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('eventPanel.eventsUpdated')}</span>
                <span className="stat-value">{result.eventsUpdated.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('eventPanel.locationsAssigned')}</span>
                <span className="stat-value">{result.locationsAssigned}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t('eventPanel.locationsIgnored')}</span>
                <span className="stat-value">{result.locationsIgnored}</span>
              </div>
            </div>
          </div>

          {(result.eventsCreated.length > 0 || result.eventsUpdated.length > 0) && (
            <div className="events-list">
              <h4>{t('eventPanel.detectedEvents', { count: result.eventsCreated.length + result.eventsUpdated.length })}</h4>
              <div className="events-grid">
                {[...result.eventsCreated, ...result.eventsUpdated].map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="event-header">
                      <span className="event-category">{event.name}</span>
                      {event.requiresReview && (
                        <span className="event-badge review">{t('eventPanel.needsReview')}</span>
                      )}
                      {event.isExpired && (
                        <span className="event-badge inactive">{t('eventPanel.expired')}</span>
                      )}
                    </div>
                    <div className="event-details">
                      <p>
                        <strong>{t('eventPanel.center')}:</strong> {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                      </p>
                      <p>
                        <strong>{t('eventPanel.confidence')}:</strong> {(event.confidenceScore * 100).toFixed(0)}%
                      </p>
                      <p>
                        <strong>{t('eventPanel.locations')}:</strong> {event.locationsCount}
                      </p>
                      <p className="event-date">
                        <strong>{t('eventPanel.created')}:</strong> {new Date(event.createdAt).toLocaleString()}
                      </p>
                      <p className="event-date">
                        <strong>{t('eventPanel.expires')}:</strong> {new Date(event.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventDetectionPanel;
