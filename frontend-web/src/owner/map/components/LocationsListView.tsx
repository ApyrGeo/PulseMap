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
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          My Locations ({myLocations.length})
        </Typography>
        
        <Stack direction="row" spacing={1}>
          <Chip
            label={`All (${myLocations.length})`}
            onClick={() => setFilter('all')}
            color={filter === 'all' ? 'primary' : 'default'}
          />
          <Chip
            label={`Active (${myLocations.filter((l) => !l.isExpired).length})`}
            onClick={() => setFilter('active')}
            color={filter === 'active' ? 'primary' : 'default'}
          />
          <Chip
            label={`Expired (${myLocations.filter((l) => l.isExpired).length})`}
            onClick={() => setFilter('expired')}
            color={filter === 'expired' ? 'default' : 'default'}
          />
          <Chip
            label={`Needs Review (${myLocations.filter((l) => l.requiresReview).length})`}
            onClick={() => setFilter('review')}
            color={filter === 'review' ? 'warning' : 'default'}
            icon={<Warning />}
          />
        </Stack>
      </Box>

      {/* Owned location alert */}
      {ownedLocation && (
        <Alert severity="info" sx={{ mb: 2 }} icon={<EmojiEvents />}>
          You own: <strong>{ownedLocation.name}</strong> - This is your permanent location
        </Alert>
      )}

      {/* Locations list */}
      {filteredLocations.length === 0 ? (
        <Alert severity="info">No locations found with the current filter.</Alert>
      ) : (
        <Stack spacing={2}>
          {filteredLocations.map((location) => (
            <Card
              key={location.id}
              sx={{
                position: 'relative',
                border: location.owner?.id === currentUserId ? '2px solid #F59E0B' : 'none',
                opacity: location.isExpired ? 0.6 : 1,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {location.description}
                      </Typography>
                    )}

                    {/* Event Review Info */}
                    {location.requiresReview && location.event && (
                      <Alert
                        severity="warning"
                        sx={{ mt: 2 }}
                        icon={<Warning />}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Event Assignment Pending Review
                        </Typography>
                        <Typography variant="body2">
                          Event: <strong>{location.event.name}</strong>
                        </Typography>
                        {location.eventAssignmentConfidence !== undefined && (
                          <Typography variant="body2">
                            Confidence: <strong>{(location.eventAssignmentConfidence * 100).toFixed(1)}%</strong>
                          </Typography>
                        )}
                      </Alert>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Favorite fontSize="small" color="action" />
                        <Typography variant="caption">{location.likesCount}</Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <ChatBubble fontSize="small" color="action" />
                        <Typography variant="caption">{location.messages.length}</Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Timer fontSize="small" color="action" />
                        <Typography variant="caption">
                          Expires: {formatDate(location.expiresAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {location.requiresReview && (
                      <>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircle />}
                          onClick={() => handleConfirmEvent(location.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Cancel />}
                          onClick={() => handleRejectEvent(location.id)}
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
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(location.id)}
                      disabled={location.owner?.id === currentUserId}
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
