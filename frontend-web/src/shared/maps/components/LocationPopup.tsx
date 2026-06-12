import {
  Location,
  MessagePostDTO,
  ResponseMessagePostDTO,
  LocationCategory,
} from '../Interfaces';
import { useEffect, useState, useRef, memo } from 'react';
import LocationComments from './LocationComments';
import { useAuth } from '../../../auth/AuthProvider';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { reportLocation, ReportType } from '../services/ReportApiService';
import ImageStack from '../../components/Stack/Stack';
import { useMap } from 'react-leaflet';
import './LocationPopup.css';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Chip,
  Card,
  Divider,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  AccessTime,
  Warning,
  Image as ImageIcon,
  Flag,
  Close,
} from '@mui/icons-material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const categoryColors: { [key: string]: string } = {
  [LocationCategory.NotSet]: '#6B7280', 
  [LocationCategory.Music]: '#8B5CF6', 
  [LocationCategory.Sport]: '#10B981', 
  [LocationCategory.Food]: '#F59E0B',
  [LocationCategory.Entertainment]: '#EF4444',
  [LocationCategory.Education]: '#3B82F6',
  [LocationCategory.Health]: '#EC4899', 
  [LocationCategory.Technology]: '#14B8A6', 
  [LocationCategory.Travel]: '#F97316', 
  [LocationCategory.Art]: '#A855F7', 
  [LocationCategory.Business]: '#06B6D4', 
};

interface LocationPopupProps {
  location: Location;
  onAddComment: (message: MessagePostDTO) => void;
  onAddResponse: (message: ResponseMessagePostDTO) => void;
  onLike: (locationId: number) => void;
  onUnlike: (locationId: number) => void;
}

const LocationPopup = memo(
  ({
    location,
    onAddComment,
    onAddResponse,
    onLike,
    onUnlike,
  }: LocationPopupProps) => {
    const map = useMap();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [likeCount, setLikeCount] = useState(location.likesCount || 0);
    const [isLiked, setIsLiked] = useState(location.isLikedByCurrentUser);
    const isOptimisticUpdate = useRef(false);
    const [hasReported, setHasReported] = useState(false);
    const [isReporting, setIsReporting] = useState(false);
    const [reportMenuAnchor, setReportMenuAnchor] = useState<null | HTMLElement>(null);

    const reportTypeLabels: Record<ReportType, string> = {
      [ReportType.LocationDoesNotExist]: t('location.reportTypes.doesNotExist'),
      [ReportType.MisleadingInformation]: t('location.reportTypes.misleading'),
      [ReportType.InappropriateContent]: t('location.reportTypes.inappropriate'),
      [ReportType.Duplicate]: t('location.reportTypes.duplicate'),
    };

    const images =
      location.imageUrls && location.imageUrls.length > 0
        ? location.imageUrls
        : [];
    const hasImages = images.length > 0;

    const handleLikeToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      isOptimisticUpdate.current = true;

      if (isLiked) {
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
        onUnlike(location.id);
      } else {
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        onLike(location.id);
      }

      setTimeout(() => {
        isOptimisticUpdate.current = false;
      }, 1000);
    };

    useEffect(() => {
      if (isOptimisticUpdate.current) return;
      setLikeCount(location.likesCount || 0);
      setIsLiked(location.isLikedByCurrentUser);
    }, [location.likesCount, location.isLikedByCurrentUser]);

    const handleReportSelect = async (type: ReportType) => {
      setReportMenuAnchor(null);
      if (!user) return;
      setIsReporting(true);
      try {
        await reportLocation(user.id, location.id, type);
        setHasReported(true);
        toast.success(t('location.reportSuccess'));
      } catch (err) {
        if (err instanceof Error && err.message === 'ALREADY_REPORTED') {
          toast.error(t('location.alreadyReported'));
          setHasReported(true);
        } else {
          toast.error(t('location.reportError'));
        }
      } finally {
        setIsReporting(false);
      }
    };

    const catColor = categoryColors[location.category] ?? '#6B7280';

    return (
      <Box sx={{ minWidth: 550, maxWidth: 650, bgcolor: '#1A1A2E', borderRadius: 2, overflow: 'hidden' }}>

        {/* Header — category color background */}
        <Box sx={{ backgroundColor: catColor, px: 2.5, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {location.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500, letterSpacing: 0.4 }}>
              {location.category}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            {location.requiresReview && (
              <Chip icon={<Warning sx={{ color: 'white !important', fontSize: '0.9rem !important' }} />} label={t('location.reviewNeeded')} size="small"
                sx={{ bgcolor: 'rgba(255,193,7,0.85)', color: 'white', fontWeight: 700, fontSize: '0.7rem' }} />
            )}
            {/* Like counter */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(0,0,0,0.25)', borderRadius: 99, px: 1.2, py: 0.4 }}>
              {isLiked ? <Favorite sx={{ fontSize: 14, color: '#fff' }} /> : <FavoriteBorder sx={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }} />}
              <Typography sx={{ color: 'white', fontSize: '0.8rem', fontWeight: 700 }}>{likeCount}</Typography>
            </Box>
            {/* Close button */}
            <IconButton
              size="small"
              onClick={() => map.closePopup()}
              sx={{ color: 'rgba(255,255,255,0.8)', bgcolor: 'rgba(0,0,0,0.25)', p: 0.4, '&:hover': { bgcolor: 'rgba(0,0,0,0.45)', color: 'white' } }}
            >
              <Close sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
        </Box>

        {/* Main Content */}
        <Box sx={{ display: 'flex', gap: 2, p: 2 }}>

          {/* Left Side */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

            {/* Creator + Expiry row */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              {location.creator && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: catColor, fontSize: '0.8rem', fontWeight: 700 }}>
                    {location.creator.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#8E8E8E', fontSize: '0.65rem', display: 'block', lineHeight: 1 }}>
                      {location.owner ? t('location.owner') : t('location.creator')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem' }}>
                      {location.creator.username}
                    </Typography>
                  </Box>
                </Stack>
              )}
              <Chip icon={<AccessTime sx={{ fontSize: '0.85rem !important' }} />}
                label={new Date(location.expiresAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                size="small" variant="outlined"
                sx={{ fontSize: '0.7rem', borderColor: '#2D2D44', color: '#8E8E8E', '& .MuiChip-icon': { color: '#8E8E8E' } }}
              />
            </Stack>

            {/* Description */}
            {location.description && (
              <Typography variant="body2" sx={{ color: '#ccc', fontSize: '0.82rem', lineHeight: 1.5, p: 1.2, bgcolor: '#0F0F1A', borderRadius: 1, border: '1px solid #2D2D44' }}>
                {location.description}
              </Typography>
            )}

            {/* Event badge */}
            {location.event && (
              <Box sx={{ p: 1.2, bgcolor: location.event.requiresReview ? '#2D1F0A' : '#0A2D1A', borderRadius: 1, border: 1, borderColor: location.event.requiresReview ? '#f59e0b' : '#10b981' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <img src="/icons/target.png" style={{ width: 13, height: 13 }} alt="" />
                  <Typography variant="caption" sx={{ color: location.event.requiresReview ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
                    {t('location.partOfEvent')}
                  </Typography>
                  <Chip label={location.event.name} size="small"
                    sx={{ fontSize: '0.7rem', fontWeight: 700, bgcolor: location.event.requiresReview ? '#f59e0b' : '#10b981', color: 'white' }} />
                </Stack>
                {location.eventAssignmentConfidence && (
                  <Typography variant="caption" sx={{ color: location.event.requiresReview ? '#fbbf24' : '#34d399', mt: 0.5, display: 'block' }}>
                    {t('location.matchConfidence')} {(location.eventAssignmentConfidence * 100).toFixed(0)}%
                  </Typography>
                )}
              </Box>
            )}

            {/* Actions */}
            {user && user.id !== location.creator?.id && (
              <Stack direction="row" spacing={1}>
                <Button size="small" variant={isLiked ? 'contained' : 'outlined'}
                  startIcon={isLiked ? <Favorite /> : <FavoriteBorder />}
                  onClick={handleLikeToggle}
                  sx={{ flex: 1, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                    ...(isLiked
                      ? { bgcolor: '#ef4444', borderColor: '#ef4444', color: 'white', '&:hover': { bgcolor: '#dc2626' } }
                      : { borderColor: '#2D2D44', color: '#ccc', '&:hover': { borderColor: '#ef4444', color: '#ef4444' } })
                  }}>
                  {isLiked ? t('location.unlike') : t('location.like')}
                </Button>
                <>
                  <Button size="small" variant="outlined" startIcon={<Flag />}
                    disabled={hasReported || isReporting}
                    onClick={(e) => setReportMenuAnchor(e.currentTarget)}
                    sx={{ flex: 1, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', borderColor: '#2D2D44', color: hasReported ? '#8E8E8E' : '#F59E0B', '&:hover': { borderColor: '#F59E0B' } }}>
                    {hasReported ? t('location.reported') : t('location.report')}
                  </Button>
                  <Menu anchorEl={reportMenuAnchor} open={Boolean(reportMenuAnchor)} onClose={() => setReportMenuAnchor(null)}
                    PaperProps={{ sx: { bgcolor: '#1A1A2E', color: 'white', border: '1px solid #2D2D44' } }}>
                    {(Object.values(ReportType).filter((v) => typeof v === 'number') as ReportType[]).map((type) => (
                      <MenuItem key={type} onClick={() => handleReportSelect(type)} sx={{ fontSize: '0.875rem' }}>
                        {reportTypeLabels[type]}
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              </Stack>
            )}

            {/* Comments */}
            {user && (
              <>
                <Divider sx={{ borderColor: '#2D2D44' }} />
                <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
                  <LocationComments
                    comments={location.messages}
                    currentUser={location.creator}
                    onAddComment={(content) => onAddComment({ locationId: location.id, content, senderId: user.id })}
                    onAddResponse={(messageId, content) => onAddResponse({ messageId, content, senderId: user.id })}
                  />
                </Box>
              </>
            )}
          </Box>

          {/* Right Side - Image Stack */}
          <Box sx={{ width: 250, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
            {hasImages ? (
              <ImageStack cards={images.map((url, i) => ({ id: i, img: url }))} autoplayDelay={2000} sensitivity={150} cardDimensions={{ width: 220, height: 280 }} />
            ) : (
              <Card sx={{ width: 220, height: 280, backgroundColor: catColor + '33', border: `1px solid ${catColor}55`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, borderRadius: 2 }}>
                <ImageIcon sx={{ fontSize: 64, color: catColor, opacity: 0.6 }} />
                <Typography variant="body2" sx={{ color: '#8E8E8E', fontWeight: 500 }}>No images</Typography>
              </Card>
            )}
          </Box>
        </Box>
      </Box>
    );
  }
);

LocationPopup.displayName = 'LocationPopup';

export default LocationPopup;
