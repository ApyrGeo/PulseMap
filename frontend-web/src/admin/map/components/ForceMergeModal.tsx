import { useState, useEffect } from 'react';
import { Location } from '../../../shared/maps/Interfaces';
import { fetchLocations } from '../../../shared/maps/services/LocationsApiService';
import { ForceMergeRequest } from '../services/AIApiService';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert,
} from '@mui/material';

interface ForceMergeModalProps {
  isOpen: boolean;
  location1Id: number;
  location2Id: number;
  onClose: () => void;
  onConfirm: (request: ForceMergeRequest) => Promise<void>;
}

const ForceMergeModal = ({
  isOpen,
  location1Id,
  location2Id,
  onClose,
  onConfirm,
}: ForceMergeModalProps) => {
  const [location1, setLocation1] = useState<Location | null>(null);
  const [location2, setLocation2] = useState<Location | null>(null);
  const [selectedKeep, setSelectedKeep] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLocations();
    }
  }, [isOpen, location1Id, location2Id]);

  const loadLocations = async () => {
    setLoading(true);
    setError(null);
    try {
      const allLocations = await fetchLocations(true);
      const loc1 = allLocations.find((l) => l.id === location1Id);
      const loc2 = allLocations.find((l) => l.id === location2Id);
      setLocation1(loc1 || null);
      setLocation2(loc2 || null);
    } catch (err) {
      setError('Failed to load location details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedKeep) return;
    const removeId = selectedKeep === location1Id ? location2Id : location1Id;
    try {
      await onConfirm({
        keepLocationId: selectedKeep,
        removeLocationId: removeId,
      });
      onClose();
    } catch (err) {
      setError('Failed to merge locations');
      console.error(err);
    }
  };

  const renderLocationCard = (
    location: Location | null,
    locationId: number
  ) => {
    if (!location) {
      return (
        <Card variant="outlined" sx={{ opacity: 0.6 }}>
          <CardContent>
            <Typography color="text.secondary">
              Location ID: {locationId} (not found)
            </Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card
        variant="outlined"
        sx={{
          border: selectedKeep === locationId ? '2px solid #3b82f6' : undefined,
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': { boxShadow: 2 },
        }}
        onClick={() => setSelectedKeep(locationId)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Radio checked={selectedKeep === locationId} />
            <Typography variant="h6">{location.name}</Typography>
            <Chip label={location.category} size="small" color="primary" />
          </Box>
          {location.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {location.description}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            Creator: {location.creator.username} | Likes: {location.likesCount}{' '}
            | Messages: {location.messages?.length || 0}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Location ID: {location.id}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Force Merge Locations</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Typography>Loading location details...</Typography>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Select which location to keep. The other location will be removed
              and its data (messages, likes) will be merged into the kept
              location.
            </Typography>
            <RadioGroup value={selectedKeep}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  value={location1Id}
                  control={<Radio sx={{ display: 'none' }} />}
                  label={renderLocationCard(location1, location1Id)}
                  sx={{ m: 0 }}
                />
                <FormControlLabel
                  value={location2Id}
                  control={<Radio sx={{ display: 'none' }} />}
                  label={renderLocationCard(location2, location2Id)}
                  sx={{ m: 0 }}
                />
              </Box>
            </RadioGroup>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={!selectedKeep || loading}
        >
          Confirm Merge
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ForceMergeModal;
