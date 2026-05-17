import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Location, LocationPutDTO } from '../../../shared/maps/Interfaces';
import EditLocationModal from '../../../shared/maps/components/EditLocationModal';
import {
  Box,
  Typography,
  Chip,
  Button,
  Stack,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit,
  Delete,
  Favorite,
  ChatBubble,
  Warning,
  AccessTime,
  EmojiEvents,
  CheckCircle,
  Cancel,
  Image as ImageIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

interface LocationsListViewProps {
  locations: Location[];
  currentUserId: number;
  onUpdate: (locationId: number, data: LocationPutDTO) => Promise<void>;
  onDelete: (locationId: number) => Promise<void>;
  onConfirmEvent: (locationId: number) => Promise<void>;
  onRejectEvent: (locationId: number) => Promise<void>;
}

const categoryColors: { [key: string]: string } = {
  'Not Set': '#6B7280',
  Music: '#8B5CF6',
  Sport: '#10B981',
  Food: '#F59E0B',
  Entertainment: '#EF4444',
  Education: '#3B82F6',
  Health: '#EC4899',
  Technology: '#14B8A6',
  Travel: '#F97316',
  Art: '#A855F7',
  Business: '#06B6D4',
};

const DARK = {
  bg: '#0F0F1A',
  surface: '#1A1A2E',
  border: '#2D2D44',
  muted: '#8E8E8E',
};

const formatDate = (date: Date) =>
  new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const LocationsListView = ({
  locations,
  currentUserId,
  onUpdate,
  onDelete,
  onConfirmEvent,
  onRejectEvent,
}: LocationsListViewProps) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'review'>('all');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const myLocations = locations.filter(
    (loc) => loc.creator.id === currentUserId || loc.owner?.id === currentUserId
  );

  const filteredLocations = myLocations.filter((loc) => {
    if (filter === 'active') return !loc.isExpired;
    if (filter === 'expired') return loc.isExpired;
    if (filter === 'review') return loc.requiresReview;
    return true;
  });

  const handleEdit = async (data: LocationPutDTO) => {
    if (!editingLocation) return;
    try {
      await onUpdate(editingLocation.id, data);
      toast.success(t('ownerLocations.updateSuccess'));
      setEditingLocation(null);
    } catch {
      toast.error(t('ownerLocations.updateError'));
    }
  };

  const handleDelete = async (locationId: number) => {
    if (!window.confirm(t('ownerLocations.deleteConfirm'))) return;
    try {
      await onDelete(locationId);
      toast.success(t('ownerLocations.deleteSuccess'));
    } catch {
      toast.error(t('ownerLocations.deleteError'));
    }
  };

  const handleConfirmEvent = async (locationId: number) => {
    try {
      await onConfirmEvent(locationId);
      toast.success(t('ownerLocations.confirmSuccess'));
    } catch {
      toast.error(t('ownerLocations.confirmError'));
    }
  };

  const handleRejectEvent = async (locationId: number) => {
    if (!window.confirm(t('ownerLocations.rejectConfirm'))) return;
    try {
      await onRejectEvent(locationId);
      toast.success(t('ownerLocations.rejectSuccess'));
    } catch {
      toast.error(t('ownerLocations.rejectError'));
    }
  };

  const ownedLocation = myLocations.find((loc) => loc.owner?.id === currentUserId);

  const filters: { key: typeof filter; label: string; count: number; activeColor: string }[] = [
    { key: 'all', label: t('ownerLocations.filterAll'), count: myLocations.length, activeColor: '#22C55E' },
    { key: 'active', label: t('ownerLocations.filterActive'), count: myLocations.filter((l) => !l.isExpired).length, activeColor: '#10B981' },
    { key: 'expired', label: t('ownerLocations.filterExpired'), count: myLocations.filter((l) => l.isExpired).length, activeColor: '#EF4444' },
    { key: 'review', label: t('ownerLocations.filterReview'), count: myLocations.filter((l) => l.requiresReview).length, activeColor: '#F59E0B' },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#fff' }}>
        {t('ownerLocations.title', { count: myLocations.length })}
      </Typography>

      {/* Filter row */}
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
        {filters.map(({ key, label, count, activeColor }) => (
          <Chip
            key={key}
            label={`${label} (${count})`}
            icon={key === 'review' ? <Warning sx={{ fontSize: '0.9rem !important' }} /> : undefined}
            onClick={() => setFilter(key)}
            sx={{
              fontWeight: filter === key ? 700 : 500,
              backgroundColor: filter === key ? activeColor : DARK.border,
              color: '#fff',
              border: filter === key ? `1px solid ${activeColor}` : '1px solid transparent',
              transition: 'all 0.15s',
              '&:hover': { backgroundColor: filter === key ? activeColor : '#3D3D54' },
              '& .MuiChip-icon': { color: '#fff' },
            }}
          />
        ))}
      </Stack>

      {/* Owned location alert */}
      {ownedLocation && (
        <Alert
          icon={<EmojiEvents />}
          sx={{
            mb: 3,
            backgroundColor: '#1A1400',
            border: '1px solid #F59E0B',
            color: '#F59E0B',
            '& .MuiAlert-icon': { color: '#F59E0B' },
            borderRadius: 2,
          }}
          dangerouslySetInnerHTML={undefined}
        >
          <span dangerouslySetInnerHTML={{ __html: t('ownerLocations.ownedAlert', { name: ownedLocation.name }) }} />
        </Alert>
      )}

      {/* List */}
      {filteredLocations.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: DARK.muted }}>
          <ImageIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
          <Typography>{t('ownerLocations.noLocations')}</Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {filteredLocations.map((location) => {
            const catColor = categoryColors[location.category] ?? '#6B7280';
            const isOwned = location.owner?.id === currentUserId;
            const hasImages = location.imageUrls && location.imageUrls.length > 0;
            const thumbnail = hasImages ? location.imageUrls![0] : null;

            return (
              <Box
                key={location.id}
                sx={{
                  display: 'flex',
                  backgroundColor: DARK.surface,
                  border: `1px solid ${isOwned ? '#F59E0B55' : DARK.border}`,
                  borderLeft: `4px solid ${location.isExpired ? '#4B5563' : catColor}`,
                  borderRadius: 2,
                  overflow: 'hidden',
                  opacity: location.isExpired ? 0.75 : 1,
                  transition: 'box-shadow 0.15s',
                  '&:hover': { boxShadow: `0 0 0 1px ${catColor}44` },
                }}
              >
                {/* Thumbnail */}
                <Box
                  sx={{
                    width: 90,
                    flexShrink: 0,
                    backgroundImage: thumbnail ? `url(${thumbnail})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: catColor + '22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!thumbnail && <ImageIcon sx={{ color: catColor, opacity: 0.5, fontSize: 28 }} />}
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75, minWidth: 0 }}>
                  {/* Row 1: name + badges */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: '#fff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 220,
                      }}
                    >
                      {location.name}
                    </Typography>

                    <Chip
                      label={location.category}
                      size="small"
                      sx={{ backgroundColor: catColor + '33', color: catColor, border: `1px solid ${catColor}55`, fontSize: '0.68rem', fontWeight: 600, height: 20 }}
                    />

                    {location.isExpired ? (
                      <Chip label={t('adminPopup.expired')} size="small" sx={{ bgcolor: '#2D1B1B', color: '#EF4444', border: '1px solid #EF444455', fontSize: '0.68rem', height: 20 }} />
                    ) : (
                      <Chip label={t('adminPopup.active')} size="small" sx={{ bgcolor: '#0A2D1A', color: '#10B981', border: '1px solid #10B98155', fontSize: '0.68rem', height: 20 }} />
                    )}

                    {isOwned && (
                      <Chip icon={<EmojiEvents sx={{ fontSize: '0.75rem !important' }} />} label={t('ownerLocations.owned')} size="small"
                        sx={{ bgcolor: '#1A1400', color: '#F59E0B', border: '1px solid #F59E0B55', fontSize: '0.68rem', height: 20, '& .MuiChip-icon': { color: '#F59E0B' } }} />
                    )}

                    {location.requiresReview && (
                      <Chip icon={<Warning sx={{ fontSize: '0.75rem !important' }} />} label={t('location.reviewNeeded')} size="small"
                        sx={{ bgcolor: '#1F1800', color: '#F59E0B', border: '1px solid #F59E0B88', fontSize: '0.68rem', height: 20, '& .MuiChip-icon': { color: '#F59E0B' } }} />
                    )}
                  </Box>

                  {/* Row 2: description */}
                  {location.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: DARK.muted,
                        fontSize: '0.78rem',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.4,
                      }}
                    >
                      {location.description}
                    </Typography>
                  )}

                  {/* Row 3: event pending info */}
                  {location.requiresReview && location.event && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1, py: 0.5, bgcolor: '#1F1800', borderRadius: 1, border: '1px solid #F59E0B44' }}>
                      <Warning sx={{ fontSize: 13, color: '#F59E0B' }} />
                      <Typography variant="caption" sx={{ color: '#F59E0B', fontSize: '0.72rem' }}>
                        {t('ownerLocations.eventPending')} —{' '}
                        <strong>{location.event.name}</strong>
                        {location.eventAssignmentConfidence !== undefined && (
                          <> · {(location.eventAssignmentConfidence * 100).toFixed(0)}%</>
                        )}
                      </Typography>
                    </Box>
                  )}

                  {/* Row 4: metadata + actions */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto', flexWrap: 'wrap', gap: 1 }}>
                    {/* Metadata */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <Favorite sx={{ fontSize: 13, color: DARK.muted }} />
                        <Typography variant="caption" sx={{ color: DARK.muted, fontSize: '0.72rem' }}>{location.likesCount}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <ChatBubble sx={{ fontSize: 13, color: DARK.muted }} />
                        <Typography variant="caption" sx={{ color: DARK.muted, fontSize: '0.72rem' }}>{location.messages.length}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <AccessTime sx={{ fontSize: 13, color: location.isExpired ? '#EF4444' : DARK.muted }} />
                        <Typography variant="caption" sx={{ color: location.isExpired ? '#EF4444' : DARK.muted, fontSize: '0.72rem' }}>
                          {formatDate(location.expiresAt)}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Action buttons */}
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                      {location.requiresReview && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<CheckCircle sx={{ fontSize: '0.85rem !important' }} />}
                            onClick={() => handleConfirmEvent(location.id)}
                            sx={{ fontSize: '0.72rem', py: 0.4, px: 1, textTransform: 'none', bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
                          >
                            {t('ownerLocations.approve')}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Cancel sx={{ fontSize: '0.85rem !important' }} />}
                            onClick={() => handleRejectEvent(location.id)}
                            sx={{ fontSize: '0.72rem', py: 0.4, px: 1, textTransform: 'none', borderColor: '#EF4444', color: '#EF4444', '&:hover': { borderColor: '#DC2626', bgcolor: '#2D1B1B' } }}
                          >
                            {t('ownerLocations.reject')}
                          </Button>
                        </>
                      )}

                      <Tooltip title={t('ownerLocations.edit')}>
                        <IconButton
                          size="small"
                          onClick={() => setEditingLocation(location)}
                          sx={{ color: '#3b82f6', border: '1px solid #3b82f644', borderRadius: 1, p: 0.6, '&:hover': { bgcolor: '#0F1824', borderColor: '#3b82f6' } }}
                        >
                          <Edit sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={isOwned ? '' : t('ownerLocations.delete')}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(location.id)}
                            disabled={isOwned}
                            sx={{ color: '#EF4444', border: '1px solid #EF444444', borderRadius: 1, p: 0.6, '&:hover': { bgcolor: '#2D1B1B', borderColor: '#EF4444' }, '&.Mui-disabled': { color: '#4D4D64', borderColor: '#2D2D44' } }}
                          >
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}

      {editingLocation && (
        <EditLocationModal
          isOpen={true}
          location={editingLocation}
          onClose={() => setEditingLocation(null)}
          onSubmit={handleEdit}
        />
      )}
    </Box>
  );
};

export default LocationsListView;
