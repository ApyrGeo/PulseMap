import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { analyzeAndClusterEvents, EventClusteringResultDTO } from '../services/EventsApiService';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';

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
    <Box>
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1A1A2E', border: '1px solid #2D2D44' }}>
        <Typography variant="h6" sx={{ mb: 1, color: '#fff' }}>
          {t('eventPanel.title')}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: '#8E8E8E' }}>
          {t('eventPanel.subtitle')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label={t('eventPanel.maxDistance')}
            type="number"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            size="small"
            disabled={loading}
            sx={{
              width: 200,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#0F0F1A',
                color: '#fff',
                '& fieldset': { borderColor: '#2D2D44' },
                '&:hover fieldset': { borderColor: '#4D4D64' },
                '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
              },
              '& .MuiInputLabel-root': { color: '#8E8E8E' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
              '& input': { color: '#fff' },
            }}
          />
          <Button
            variant="contained"
            onClick={handleAnalyze}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{
              backgroundColor: '#3b82f6',
              textTransform: 'none',
              '&:hover': { backgroundColor: '#2563eb' },
              '&.Mui-disabled': { backgroundColor: '#2D2D44', color: '#8E8E8E' },
            }}
          >
            {loading ? t('eventPanel.analyzing') : t('eventPanel.detect')}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            backgroundColor: '#4D1B1B',
            border: '1px solid #FF6B6B',
            color: '#FF6B6B',
            '& .MuiAlert-icon': { color: '#FF6B6B' },
          }}
        >
          {error}
        </Alert>
      )}

      {result && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1A1A2E', border: '1px solid #2D2D44' }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
            {t('eventPanel.resultsTitle')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 4, mb: 2, flexWrap: 'wrap' }}>
            {[
              { label: t('eventPanel.eventsCreated'), value: result.eventsCreated.length },
              { label: t('eventPanel.eventsUpdated'), value: result.eventsUpdated.length },
              { label: t('eventPanel.locationsAssigned'), value: result.locationsAssigned },
              { label: t('eventPanel.locationsIgnored'), value: result.locationsIgnored },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography variant="caption" sx={{ color: '#8E8E8E', display: 'block' }}>
                  {label}
                </Typography>
                <Typography variant="h6" sx={{ color: '#10B981', fontWeight: 700 }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>

          {(result.eventsCreated.length > 0 || result.eventsUpdated.length > 0) && (
            <>
              <Typography variant="body2" sx={{ mb: 2, color: '#fff', fontWeight: 600 }}>
                {t('eventPanel.detectedEvents', { count: result.eventsCreated.length + result.eventsUpdated.length })}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                {[...result.eventsCreated, ...result.eventsUpdated].map((event) => (
                  <Box
                    key={event.id}
                    sx={{
                      backgroundColor: '#0F0F1A',
                      border: '1px solid #2D2D44',
                      borderRadius: 2,
                      p: 2,
                      '&:hover': { borderColor: '#22C55E' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                        {event.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {event.requiresReview && (
                          <Chip label={t('eventPanel.needsReview')} size="small" sx={{ backgroundColor: '#1F1800', color: '#F59E0B', fontSize: '0.7rem' }} />
                        )}
                        {event.isExpired && (
                          <Chip label={t('eventPanel.expired')} size="small" sx={{ backgroundColor: '#2D2D44', color: '#8E8E8E', fontSize: '0.7rem' }} />
                        )}
                      </Box>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#ccc', display: 'block' }}>
                      <strong>{t('eventPanel.center')}:</strong> {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ccc', display: 'block' }}>
                      <strong>{t('eventPanel.confidence')}:</strong> {(event.confidenceScore * 100).toFixed(0)}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ccc', display: 'block' }}>
                      <strong>{t('eventPanel.locations')}:</strong> {event.locationsCount}
                    </Typography>
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #2D2D44' }}>
                      <Typography variant="caption" sx={{ color: '#8E8E8E', display: 'block' }}>
                        <strong>{t('eventPanel.created')}:</strong> {new Date(event.createdAt).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8E8E8E', display: 'block' }}>
                        <strong>{t('eventPanel.expires')}:</strong> {new Date(event.expiresAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default EventDetectionPanel;
