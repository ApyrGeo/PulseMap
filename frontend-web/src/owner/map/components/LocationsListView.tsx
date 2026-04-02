import { useState } from 'react';
import { Location, LocationPutDTO } from '../../../shared/maps/Interfaces';
import EditLocationModal from '../../../shared/maps/components/EditLocationModal';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import {
  Edit,
  Delete,
  Favorite,
  ChatBubble,
  Warning,
  LocationOn,
  Timer,
  EmojiEvents,
  CheckCircle,
  Cancel,
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

const LocationsListView = ({
  locations,
  currentUserId,
  onUpdate,
  onDelete,
  onConfirmEvent,
  onRejectEvent,
}: LocationsListViewProps) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'review'>('all');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

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

  // Filter locations based on current user
  const myLocations = locations.filter(
    (loc) => loc.creator.id === currentUserId || loc.owner?.id === currentUserId
  );

  // Apply additional filters
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
      toast.success('Location updated successfully!');
      setEditingLocation(null);
    } catch (error) {
      toast.error('Failed to update location');
      console.error(error);
    }
  };

  const handleDelete = async (locationId: number) => {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    
    try {
      await onDelete(locationId);
      toast.success('Location deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete location');
      console.error(error);
    }
  };

  const handleConfirmEvent = async (locationId: number) => {
    try {
      await onConfirmEvent(locationId);
      toast.success('Event confirmed successfully!');
    } catch (error) {
      toast.error('Failed to confirm event');
      console.error(error);
    }
  };

  const handleRejectEvent = async (locationId: number) => {
    if (!window.confirm('Are you sure you want to reject this event?')) return;
    
    try {
      await onRejectEvent(locationId);
      toast.success('Event rejected successfully!');
    } catch (error) {
      toast.error('Failed to reject event');
      console.error(error);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const ownedLocation = myLocations.find((loc) => loc.owner?.id === currentUserId);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with filters */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: '#fff' }}>
          My Locations ({myLocations.length})
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            label={`All (${myLocations.length})`}
            onClick={() => setFilter('all')}
            sx={{
              backgroundColor: filter === 'all' ? '#FF6B35' : '#2D2D44',
              color: '#fff',
              '&:hover': { backgroundColor: filter === 'all' ? '#E55A25' : '#3D3D54' },
            }}
          />
          <Chip
            label={`Active (${myLocations.filter((l) => !l.isExpired).length})`}
            onClick={() => setFilter('active')}
            sx={{
              backgroundColor: filter === 'active' ? '#10B981' : '#2D2D44',
              color: '#fff',
              '&:hover': { backgroundColor: filter === 'active' ? '#059669' : '#3D3D54' },
            }}
          />
          <Chip
            label={`Expired (${myLocations.filter((l) => l.isExpired).length})`}
            onClick={() => setFilter('expired')}
            sx={{
              backgroundColor: filter === 'expired' ? '#EF4444' : '#2D2D44',
              color: '#fff',
              '&:hover': { backgroundColor: filter === 'expired' ? '#DC2626' : '#3D3D54' },
            }}
          />
          <Chip
            label={`Needs Review (${myLocations.filter((l) => l.requiresReview).length})`}
            onClick={() => setFilter('review')}
            icon={<Warning />}
            sx={{
              backgroundColor: filter === 'review' ? '#F59E0B' : '#2D2D44',
              color: '#fff',
              '&:hover': { backgroundColor: filter === 'review' ? '#D97706' : '#3D3D54' },
              '& .MuiChip-icon': { color: '#fff' },
            }}
          />
        </Stack>
      </Box>

      {/* Owned location alert */}
      {ownedLocation && (
        <Alert
          severity="info"
          sx={{
            mb: 2,
            backgroundColor: '#0F1824',
            border: '1px solid #3b82f6',
            color: '#3b82f6',
            '& .MuiAlert-icon': { color: '#3b82f6' },
          }}
          icon={<EmojiEvents />}
        >
          You own: <strong>{ownedLocation.name}</strong> - This is your permanent location
        </Alert>
      )}

      {/* Locations list */}
      {filteredLocations.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            backgroundColor: '#0F1824',
            border: '1px solid #3b82f6',
            color: '#3b82f6',
            '& .MuiAlert-icon': { color: '#3b82f6' },
          }}
        >
          No locations found with the current filter.
        </Alert>
      ) : (
        <Stack spacing={2}>
          {filteredLocations.map((location) => (
            <Card
              key={location.id}
              sx={{
                position: 'relative',
                backgroundColor: '#1A1A2E',
                border: location.owner?.id === currentUserId ? '2px solid #F59E0B' : '1px solid #2D2D44',
                opacity: location.isExpired ? 0.7 : 1,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff' }}>
                        {location.name}
                      </Typography>
                      
                      {/* Requires Review indicator */}
                      {location.requiresReview && (
                        <Chip
                          icon={<Warning />}
                          label="!"
                          color="warning"
                          size="small"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                      
                      {/* Owned badge */}
                      {location.owner?.id === currentUserId && (
                        <Chip
                          icon={<EmojiEvents />}
                          label="Owned"
                          color="warning"
                          size="small"
                        />
                      )}
                      
                      {/* Expired badge */}
                      {location.isExpired && (
                        <Chip label="Expired" color="error" size="small" />
                      )}
                    </Box>

                    <Chip
                      label={location.category}
                      size="small"
                      sx={{
                        backgroundColor: categoryColors[location.category] || '#6B7280',
                        color: 'white',
                        mb: 1,
                      }}
                    />

                    {location.description && (
                      <Typography variant="body2" sx={{ mt: 1, color: '#8E8E8E' }}>
                        {location.description}
                      </Typography>
                    )}

                    {/* Event Review Info */}
                    {location.requiresReview && location.event && (
                      <Alert
                        severity="warning"
                        sx={{
                          mt: 2,
                          backgroundColor: '#1F1800',
                          border: '1px solid #F59E0B',
                          color: '#F59E0B',
                          '& .MuiAlert-icon': { color: '#F59E0B' },
                        }}
                        icon={<Warning />}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                          Event Assignment Pending Review
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#F59E0B' }}>
                          Event: <strong>{location.event.name}</strong>
                        </Typography>
                        {location.eventAssignmentConfidence !== undefined && (
                          <Typography variant="body2" sx={{ color: '#F59E0B' }}>
                            Confidence: <strong>{(location.eventAssignmentConfidence * 100).toFixed(1)}%</strong>
                          </Typography>
                        )}
                      </Alert>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn fontSize="small" sx={{ color: '#8E8E8E' }} />
                        <Typography variant="caption" sx={{ color: '#8E8E8E' }}>
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Favorite fontSize="small" sx={{ color: '#8E8E8E' }} />
                        <Typography variant="caption" sx={{ color: '#ccc' }}>{location.likesCount}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ChatBubble fontSize="small" sx={{ color: '#8E8E8E' }} />
                        <Typography variant="caption" sx={{ color: '#ccc' }}>{location.messages.length}</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Timer fontSize="small" sx={{ color: '#8E8E8E' }} />
                        <Typography variant="caption" sx={{ color: '#ccc' }}>
                          Expires: {formatDate(location.expiresAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                    {location.requiresReview && (
                      <>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CheckCircle />}
                          onClick={() => handleConfirmEvent(location.id)}
                          sx={{ backgroundColor: '#10B981', '&:hover': { backgroundColor: '#059669' } }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Cancel />}
                          onClick={() => handleRejectEvent(location.id)}
                          sx={{ borderColor: '#EF4444', color: '#EF4444', '&:hover': { borderColor: '#DC2626', backgroundColor: '#2D1B1B' } }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => setEditingLocation(location)}
                      sx={{ borderColor: '#3b82f6', color: '#3b82f6', '&:hover': { borderColor: '#2563eb', backgroundColor: '#0F1824' } }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(location.id)}
                      disabled={location.owner?.id === currentUserId}
                      sx={{ borderColor: '#EF4444', color: '#EF4444', '&:hover': { borderColor: '#DC2626', backgroundColor: '#2D1B1B' }, '&.Mui-disabled': { borderColor: '#2D2D44', color: '#4D4D64' } }}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Edit Modal */}
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
