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
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Admin Events Management
      </Typography>

      <EventDetectionPanel />

      <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
        Duplicate Location Management
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Check and Merge Duplicates
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Max Distance (meters)"
            type="number"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            size="small"
            sx={{ width: 200 }}
          />
          <Button
            variant="contained"
            onClick={handleCheckMerge}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Checking...' : 'Check & Merge Duplicates'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {results && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Results
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            {results.message}
          </Alert>

          {results.results && results.results.length > 0 ? (
            <>
              <Divider sx={{ mb: 2 }} />
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
            <Typography variant="body2" color="text.secondary">
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
