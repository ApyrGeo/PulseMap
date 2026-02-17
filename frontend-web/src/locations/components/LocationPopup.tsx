import {
  Location,
  MessagePostDTO,
  ResponseMessagePostDTO,
  LocationCategory,
} from '../Interfaces';
import { useEffect, useState, useRef, memo } from 'react';
import LocationComments from './LocationComments';
import { useAuth } from '../../auth/AuthProvider';
import {
  Box,
  Typography,
  Avatar,
  Button,
  IconButton,
  Chip,
  Card,
  Divider,
  Stack,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  NavigateBefore,
  NavigateNext,
  AccessTime,
} from '@mui/icons-material';

const categoryColors: { [key: string]: string } = {
  [LocationCategory.NotSet]: '#6B7280', // Gray
  [LocationCategory.Music]: '#8B5CF6', // Purple
  [LocationCategory.Sport]: '#10B981', // Green
  [LocationCategory.Food]: '#F59E0B', // Orange
  [LocationCategory.Entertainment]: '#EF4444', // Red
  [LocationCategory.Education]: '#3B82F6', // Blue
  [LocationCategory.Health]: '#EC4899', // Pink
  [LocationCategory.Technology]: '#14B8A6', // Teal
  [LocationCategory.Travel]: '#F97316', // Orange-Red
  [LocationCategory.Art]: '#A855F7', // Purple-Pink
  [LocationCategory.Business]: '#06B6D4', // Cyan
};

interface LocationPopupProps {
  location: Location;
  onAddComment: (message: MessagePostDTO) => void;
  onAddResponse: (message: ResponseMessagePostDTO) => void;
  onLike: (locationId: number) => void;
  onUnlike: (locationId: number) => void;
}

const LocationPopup = memo(({
  location,
  onAddComment,
  onAddResponse,
  onLike,
  onUnlike,
}: LocationPopupProps) => {
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [likeCount, setLikeCount] = useState(location.likesCount || 0);
  const [isLiked, setIsLiked] = useState(location.isLikedByCurrentUser);
  const isOptimisticUpdate = useRef(false);

  const placeholderImages = ['📍 Image 1', '🗺️ Image 2', '📷 Image 3'];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % placeholderImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? placeholderImages.length - 1 : prev - 1
    );
  };

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // Mark as optimistic update to prevent useEffect from overwriting
    isOptimisticUpdate.current = true;
    
    // Optimistically update UI immediately
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
      onUnlike(location.id);
    } else {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
      onLike(location.id);
    }
    
    // Reset flag after a short delay to allow server update
    setTimeout(() => {
      isOptimisticUpdate.current = false;
    }, 1000);
  };

  useEffect(() => {
    // Don't update if we're in the middle of an optimistic update
    if (isOptimisticUpdate.current) {
      return;
    }
    setLikeCount(location.likesCount || 0);
    setIsLiked(location.isLikedByCurrentUser);
  }, [location.likesCount, location.isLikedByCurrentUser]);

  return (
    <Box
      sx={{
        minWidth: 550,
        maxWidth: 650,
        bgcolor: 'background.paper',
        p: 2,
        borderRadius: 2,
      }}
    >
      {/* Header */}
      <Typography
        variant="h6"
        component="h3"
        sx={{
          fontWeight: 700,
          mb: 1.5,
          textAlign: 'center',
          color: 'primary.main',
        }}
      >
        {location.name}
      </Typography>

      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Left Side - Info & Comments */}
        <Box
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}
        >
          {/* Description */}
          {location.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {location.description}
            </Typography>
          )}

          {/* Compact Info Section */}
          <Stack spacing={1} sx={{ mb: 1 }}>
            {/* Category */}
            {location.category && (
              <Chip
                label={location.category}
                size="small"
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  alignSelf: 'flex-start',
                  backgroundColor:
                    categoryColors[location.category] || '#6B7280',
                  color: 'white',
                }}
              />
            )}

            {/* Creator */}
            {location.creator && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: 'primary.main',
                    fontSize: '0.875rem',
                  }}
                >
                  {location.creator.username.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {location.owner ? 'Owner' : 'Creator'}
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {location.creator.username}
                  </Typography>
                </Box>
              </Stack>
            )}

            {/* Event Info */}
            {location.event && (
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: location.event.requiresReview ? '#fef3c7' : '#d1fae5',
                  borderRadius: 1,
                  border: 1,
                  borderColor: location.event.requiresReview ? '#f59e0b' : '#10b981',
                }}
              >
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight={600} sx={{ color: location.event.requiresReview ? '#92400e' : '#065f46' }}>
                      🎯 Part of Event:
                    </Typography>
                    <Chip
                      label={location.event.name}
                      size="small"
                      sx={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        bgcolor: location.event.requiresReview ? '#f59e0b' : '#10b981',
                        color: 'white',
                      }}
                    />
                  </Stack>
                  {location.eventAssignmentConfidence && (
                    <Typography variant="caption" sx={{ color: location.event.requiresReview ? '#92400e' : '#065f46', fontWeight: 500 }}>
                      Match Confidence: {(location.eventAssignmentConfidence * 100).toFixed(0)}%
                    </Typography>
                  )}
                  {location.event.requiresReview && (
                    <Typography variant="caption" sx={{ color: '#92400e', fontStyle: 'italic' }}>
                      ⚠️ This event requires admin review
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}

            {/* Expires & Likes in one row */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                icon={<AccessTime />}
                label={new Date(location.expiresAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                size="small"
                color="error"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
              <Chip
                label={`${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            </Stack>

            {/* Like Button */}
            <Button
              fullWidth
              size="small"
              variant={isLiked ? 'contained' : 'outlined'}
              color={isLiked ? 'error' : 'primary'}
              startIcon={isLiked ? <Favorite /> : <FavoriteBorder />}
              onClick={handleLikeToggle}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {isLiked ? 'Unlike' : 'Like'}
            </Button>
          </Stack>

          {/* Comments Section */}
          {user && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ maxHeight: 250, overflowY: 'auto' }}>
                <LocationComments
                  comments={location.messages}
                  currentUser={location.creator}
                  onAddComment={(content) =>
                    onAddComment({
                      locationId: location.id,
                      content,
                      senderId: user.id,
                    })
                  }
                  onAddResponse={(messageId, content) =>
                    onAddResponse({
                      messageId,
                      content,
                      senderId: user.id,
                    })
                  }
                />
              </Box>
            </>
          )}
        </Box>

        {/* Right Side - Image Carousel */}
        <Box sx={{ width: 250, flexShrink: 0 }}>
          <Card
            sx={{
              position: 'relative',
              height: '100%',
              minHeight: 320,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {placeholderImages[currentImageIndex]}
            </Typography>

            {placeholderImages.length > 1 && (
              <>
                <IconButton
                  onClick={prevImage}
                  sx={{
                    position: 'absolute',
                    left: 8,
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': { bgcolor: 'white' },
                  }}
                >
                  <NavigateBefore />
                </IconButton>

                <IconButton
                  onClick={nextImage}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': { bgcolor: 'white' },
                  }}
                >
                  <NavigateNext />
                </IconButton>

                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                  }}
                >
                  {placeholderImages.map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: index === currentImageIndex ? 16 : 8,
                        height: 8,
                        borderRadius: 4,
                        bgcolor:
                          index === currentImageIndex
                            ? 'white'
                            : 'rgba(255, 255, 255, 0.5)',
                        transition: 'all 0.3s',
                      }}
                    />
                  ))}
                </Stack>
              </>
            )}
          </Card>
        </Box>
      </Box>
    </Box>
  );
});

LocationPopup.displayName = 'LocationPopup';

export default LocationPopup;
