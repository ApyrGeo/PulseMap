import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const MiniMap = ({ lat, lng }: { lat: number; lng: number }) => (
  <MapContainer
    center={[lat, lng]}
    zoom={15}
    style={{ height: 120, width: '100%', borderRadius: 6, marginTop: 8 }}
    zoomControl={false}
    scrollWheelZoom={false}
    dragging={false}
    attributionControl={false}
  >
    <TileLayer
      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
      maxZoom={22}
      maxNativeZoom={19}
      subdomains={['a', 'b', 'c', 'd']}
    />
    <Marker position={[lat, lng]} />
  </MapContainer>
);

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
  const { t } = useTranslation();
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
      setError(t('forceMerge.loadError'));
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
      setError(t('forceMerge.mergeError'));
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
              {t('forceMerge.notFound', { id: locationId })}
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
            {t('forceMerge.creator')}: {location.creator.username} | {t('forceMerge.likes')}: {location.likesCount}{' '}
            | {t('forceMerge.messages')}: {location.messages?.length || 0}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Location ID: {location.id} | {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </Typography>
          <MiniMap lat={location.latitude} lng={location.longitude} />
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('forceMerge.title')}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Typography>{t('forceMerge.loading')}</Typography>
        ) : (
          <>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t('forceMerge.description')}
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
        <Button onClick={onClose}>{t('forceMerge.cancel')}</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={!selectedKeep || loading}
        >
          {t('forceMerge.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ForceMergeModal;
