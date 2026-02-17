import { useState } from 'react';
import { analyzeAndClusterEvents, EventClusteringResultDTO } from '../../../core/api/EventsApiService';
import './EventDetectionPanel.css';

const EventDetectionPanel = () => {
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
      setError('Failed to analyze events. Please try again.');
      console.error('Error analyzing events:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-detection-panel">
      <div className="event-detection-header">
        <h2>Event Detection & Clustering</h2>
        <p className="event-detection-subtitle">
          Analyze location patterns to detect and cluster events
        </p>
      </div>

      <div className="event-detection-controls">
        <div className="control-group">
          <label htmlFor="maxDistance">Max Distance (meters)</label>
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
          {loading ? 'Analyzing...' : 'Detect Events'}
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
            <h3>Analysis Results</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">Events Created:</span>
                <span className="stat-value">{result.eventsCreated}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Locations Processed:</span>
                <span className="stat-value">{result.locationsProcessed}</span>
              </div>
            </div>
          </div>

          {result.events && result.events.length > 0 && (
            <div className="events-list">
              <h4>Detected Events ({result.events.length})</h4>
              <div className="events-grid">
                {result.events.map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="event-header">
                      <span className="event-category">{event.name}</span>
                      {event.requiresReview && (
                        <span className="event-badge review">Needs Review</span>
                      )}
                      {event.isExpired && (
                        <span className="event-badge inactive">Expired</span>
                      )}
                    </div>
                    <div className="event-details">
                      <p>
                        <strong>Center:</strong> {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                      </p>
                      <p>
                        <strong>Confidence:</strong> {(event.confidenceScore * 100).toFixed(0)}%
                      </p>
                      <p>
                        <strong>Locations:</strong> {event.locationsCount}
                      </p>
                      <p className="event-date">
                        <strong>Created:</strong> {new Date(event.createdAt).toLocaleString()}
                      </p>
                      <p className="event-date">
                        <strong>Expires:</strong> {new Date(event.expiresAt).toLocaleString()}
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
