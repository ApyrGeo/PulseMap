import { useState } from 'react';
import {
  checkAndMergeDuplicates,
  forceMergeLocations,
  CheckMergeResponse,
  ForceMergeRequest,
} from '../map/services/AIApiService';
import MergeResultItemComponent from '../map/components/MergeResultItem';
import ForceMergeModal from '../map/components/ForceMergeModal';
import EventDetectionPanel from './components/EventDetectionPanel';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';

const AdminEventsPage = () => {
  const [maxDistance, setMaxDistance] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CheckMergeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forceMergeOpen, setForceMergeOpen] = useState(false);
  const [selectedLocation1, setSelectedLocation1] = useState<number | null>(
    null
  );
  const [selectedLocation2, setSelectedLocation2] = useState<number | null>(
    null
  );

  const handleCheckMerge = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const response = await checkAndMergeDuplicates(maxDistance);
      setResults(response);
    } catch (err) {
      setError('Failed to check and merge duplicates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForceMerge = (location1Id: number, location2Id: number) => {
    setSelectedLocation1(location1Id);
    setSelectedLocation2(location2Id);
    setForceMergeOpen(true);
  };

  const handleForceMerge = async (request: ForceMergeRequest) => {
    try {
      await forceMergeLocations(request);
      // Refresh results after merge
      await handleCheckMerge();
      setForceMergeOpen(false);
    } catch (err) {
      console.error('Force merge failed', err);
      throw err;
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <EventDetectionPanel />

      <Paper sx={{ p: 3, mb: 3, mt: 3, backgroundColor: '#1A1A2E', border: '1px solid #2D2D44' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
          Check and Merge Duplicates
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Max Distance (meters)"
            type="number"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            size="small"
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
            onClick={handleCheckMerge}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{
              backgroundColor: '#3b82f6',
              '&:hover': { backgroundColor: '#2563eb' },
              '&.Mui-disabled': { backgroundColor: '#2D2D44', color: '#8E8E8E' },
            }}
          >
            {loading ? 'Checking...' : 'Check & Merge Duplicates'}
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

      {results && (
        <Paper sx={{ p: 3, backgroundColor: '#1A1A2E', border: '1px solid #2D2D44' }}>
          <Typography variant="h6" sx={{ mb: 1, color: '#fff' }}>
            Results
          </Typography>
          <Alert
            severity="info"
            sx={{
              mb: 2,
              backgroundColor: '#0F1F18',
              border: '1px solid #10B981',
              color: '#10B981',
              '& .MuiAlert-icon': { color: '#10B981' },
            }}
          >
            {results.message}
          </Alert>

          {results.results && results.results.length > 0 ? (
            <>
              <Divider sx={{ mb: 2, borderColor: '#2D2D44' }} />
              <Box>
                {results.results.map((result, index) => (
                  <MergeResultItemComponent
                    key={index}
                    result={result}
                    onForceMerge={handleOpenForceMerge}
                  />
                ))}
              </Box>
            </>
          ) : (
            <Typography variant="body2" sx={{ color: '#8E8E8E' }}>
              No results to display.
            </Typography>
          )}
        </Paper>
      )}

      {forceMergeOpen && selectedLocation1 && selectedLocation2 && (
        <ForceMergeModal
          isOpen={forceMergeOpen}
          location1Id={selectedLocation1}
          location2Id={selectedLocation2}
          onClose={() => setForceMergeOpen(false)}
          onConfirm={handleForceMerge}
        />
      )}
    </Box>
  );
};

export default AdminEventsPage;
