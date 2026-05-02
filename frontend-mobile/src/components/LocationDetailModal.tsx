import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
  Keyboard,
  Alert,
  Modal,
} from 'react-native';
import ImageStack from './ImageStack';
import { Location, useAuth, useLocations, addComment, reportLocation, ReportType } from '@pulse-map/shared';
import { useTranslation } from 'react-i18next';
import { Icons } from '../utils/icons';

const PROD_API = 'https://pulsemap-api-effhbufudbchh9af.italynorth-01.azurewebsites.net/api';

/** Replace any localhost-based image URL with the production API URL. */
function normalizeImageUrl(url: string): string {
  const match = url.match(/\/image\/(.+)$/);
  if (match) return `${PROD_API}/image/${match[1]}`;
  return url;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Not Set':     '#6B7280',
  Music:         '#8B5CF6',
  Sport:         '#10B981',
  Food:          '#F59E0B',
  Entertainment: '#EF4444',
  Education:     '#3B82F6',
  Health:        '#EC4899',
  Technology:    '#14B8A6',
  Travel:        '#F97316',
  Art:           '#A855F7',
  Business:      '#06B6D4',
};

function formatExpiry(expiresAt: Date | string): string {
  const d = new Date(expiresAt);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  if (diffMs <= 0) return 'Expired';
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return `< 1h left`;
  if (hours < 24) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

interface Props {
  location: Location;
  onClose: () => void;
}

const { height: SCREEN_H } = Dimensions.get('window');
// Animate height (not translateY) so inputRow is always at the visible bottom
const HALF_H  = SCREEN_H * 0.52;   // initial: just over half-screen
const FULL_H  = SCREEN_H * 0.90;   // expanded: 90% — stays well below camera/status bar

export default function LocationDetailModal({ location, onClose }: Props) {
  const { user, tokenService } = useAuth();
  const { likeLocation } = useLocations();
  const { t } = useTranslation();

  const [imgIndex, setImgIndex] = useState(0);
  const [liked, setLiked] = useState(location.isLikedByCurrentUser);
  const [likeCount, setLikeCount] = useState(location.likesCount || 0);
  const [comments, setComments] = useState(location.messages ?? []);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const rawImages = location.imageUrls ?? [];
  const images = rawImages.map(normalizeImageUrl);
  const catColor = CATEGORY_COLORS[location.category] ?? '#22C55E';

  // Animate sheet height — avoids the "inputRow below screen" problem of translateY approach
  const animHeight = useRef(new Animated.Value(HALF_H)).current;
  const snapRef = useRef<'half' | 'full'>('half');

  // Slide-up on mount so the X button doesn't appear outside the sheet
  const openTranslateY = useRef(new Animated.Value(HALF_H)).current;
  useEffect(() => {
    Animated.spring(openTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [openTranslateY]);

  // Track keyboard height to push inputRow above keyboard without moving the sheet top
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  const snapTo = useCallback(
    (pos: 'half' | 'full') => {
      snapRef.current = pos;
      setIsExpanded(pos === 'full');
      Animated.spring(animHeight, {
        toValue: pos === 'full' ? FULL_H : HALF_H,
        useNativeDriver: false,   // height animation requires JS driver
        tension: 80,
        friction: 12,
      }).start();
    },
    [animHeight]
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 8,
      onPanResponderGrant: () => {
        animHeight.stopAnimation();
      },
      onPanResponderMove: (_, gs) => {
        // dy < 0 = swipe up = increase height; dy > 0 = swipe down = decrease height
        const base = snapRef.current === 'full' ? FULL_H : HALF_H;
        const next = Math.min(FULL_H, Math.max(HALF_H * 0.25, base - gs.dy));
        animHeight.setValue(next);
      },
      onPanResponderRelease: (_, gs) => {
        if (snapRef.current === 'full') {
          if (gs.dy > 60 || gs.vy > 0.5) {
            snapTo('half');
          } else {
            snapTo('full');
          }
        } else {
          if (gs.dy < -60 || gs.vy < -0.5) {
            snapTo('full');
          } else if (gs.dy > 120 || gs.vy > 1.0) {
            Animated.timing(animHeight, {
              toValue: 0,
              duration: 180,
              useNativeDriver: false,
            }).start(onClose);
          } else {
            snapTo('half');
          }
        }
      },
    })
  ).current;

  const handleLike = useCallback(async () => {
    try {
      await likeLocation(location.id);
      setLiked((prev) => !prev);
      setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    } catch (e) {
      console.error('Like failed', e);
    }
  }, [likeLocation, location.id, liked]);

  const handleReport = useCallback(async (type: ReportType) => {
    if (!user) return;
    setShowReportModal(false);
    try {
      await reportLocation(tokenService, { userId: user.id, locationId: location.id, type });
      setHasReported(true);
      Alert.alert(t('location.thankYou'), t('location.reportSuccess'));
    } catch (e) {
      if (e instanceof Error && e.message === 'ALREADY_REPORTED') {
        setHasReported(true);
        Alert.alert(t('location.alreadyReportedTitle'), t('location.alreadyReported'));
      } else {
        Alert.alert(t('common.error'), t('location.reportError'));
      }
    }
  }, [user, tokenService, location.id]);

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim() || !user) return;
    setSubmitting(true);
    try {
      const newMsg = await addComment(tokenService, {
        content: commentText.trim(),
        senderId: user.id,
        locationId: location.id,
      });
      setComments((prev) => [...prev, newMsg]);
      setCommentText('');
    } catch (e) {
      console.error('Comment failed', e);
      Alert.alert(t('common.error'), t('location.commentError'));
    } finally {
      setSubmitting(false);
    }
  }, [commentText, user, tokenService, location.id]);

  return (
    <View style={styles.overlay}>
      {/* Backdrop tap to close */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      {/* Outer view: slide-in animation (native driver — transforms only) */}
      {/* Inner view: height animation (JS driver — height not supported by native) */}
      {/* Mixing both on a single Animated.View causes the "moved to native" error */}
      <Animated.View style={{ transform: [{ translateY: openTranslateY }] }}>
      <Animated.View style={[styles.sheet, { height: animHeight }]}>
        {/* Drag area: handle + header — PanResponder only here */}
        <View style={styles.dragArea} {...panResponder.panHandlers}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.catChip, { backgroundColor: catColor + '33', borderColor: catColor }]}>
                <Text style={[styles.catChipText, { color: catColor }]}>{location.category}</Text>
              </View>
              <Text style={styles.name}>{location.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable content + comment input — paddingBottom tracks keyboard height */}
        <View style={[styles.keyboardView, { paddingBottom: keyboardHeight }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={isExpanded}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Image stack */}
            {images.length > 0 && (
              <View style={styles.carouselWrap}>
                <ImageStack images={images} height={180} autoplayDelay={2000} />
              </View>
            )}

            {location.description ? (
              <Text style={styles.description}>{location.description}</Text>
            ) : null}

            {location.event && (
              <View style={styles.eventBadge}>
                <Image source={Icons.target} style={styles.eventIcon} />
                <View>
                  <Text style={styles.eventLabel}>{t('location.partOfEvent')}</Text>
                  <Text style={styles.eventName}>{location.event.name}</Text>
                </View>
              </View>
            )}

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('location.createdBy')}</Text>
                <Text style={styles.metaValue}>
                  {location.creator?.firstName} {location.creator?.lastName}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>{t('location.expires')}</Text>
                <Text style={[styles.metaValue, location.isExpired && { color: '#EF4444' }]}>
                  {location.isExpired ? 'Expired' : formatExpiry(location.expiresAt)}
                </Text>
              </View>
            </View>

            {user?.id !== location.creator?.id && (
              <TouchableOpacity style={styles.likeBtn} onPress={handleLike}>
                <Image source={liked ? Icons.heart_filled : Icons.heart_empty} style={styles.likeIcon} />
                <Text style={styles.likeCount}>{likeCount}</Text>
                <Text style={styles.likeLabel}>{liked ? t('location.unlike') : t('location.like')}</Text>
              </TouchableOpacity>
            )}

            {user && user.id !== location.creator?.id && (
              <TouchableOpacity
                style={[styles.reportBtn, hasReported && styles.reportBtnDisabled]}
                onPress={() => !hasReported && setShowReportModal(true)}
                disabled={hasReported}
              >
                <Text style={styles.reportBtnText}>
                  {hasReported ? `⚑ ${t('location.reported')}` : `⚑ ${t('location.report')}`}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>{t('location.commentsCount', { count: comments.length })}</Text>
              {comments.map((msg) => (
                <View key={msg.id} style={styles.comment}>
                  <Text style={styles.commentAuthor}>
                    {msg.sender.firstName} {msg.sender.lastName}
                  </Text>
                  <Text style={styles.commentText}>{msg.content}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Comment input — always visible at the bottom of sheet */}
          {user && (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={t('location.commentPlaceholder')}
                placeholderTextColor="#6B6B8A"
                value={commentText}
                onChangeText={setCommentText}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!commentText.trim() || submitting) && styles.sendBtnDisabled]}
                onPress={handleAddComment}
                disabled={!commentText.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.sendBtnText}>↑</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Animated.View>
      </Animated.View>

      {/* Report type selection modal */}
      <Modal visible={showReportModal} transparent animationType="fade" onRequestClose={() => setShowReportModal(false)}>
        <TouchableOpacity style={styles.reportModalOverlay} activeOpacity={1} onPress={() => setShowReportModal(false)}>
          <View style={styles.reportModalBox}>
            <Text style={styles.reportModalTitle}>{t('location.reportTitle')}</Text>
            {([
              { type: ReportType.LocationDoesNotExist, key: 'doesNotExist' },
              { type: ReportType.MisleadingInformation, key: 'misleading' },
              { type: ReportType.InappropriateContent, key: 'inappropriate' },
              { type: ReportType.Duplicate, key: 'duplicate' },
            ] as { type: ReportType; key: string }[]).map(({ type, key }) => (
              <TouchableOpacity key={type} style={styles.reportModalOption} onPress={() => handleReport(type)}>
                <Text style={styles.reportModalOptionText}>{t(`location.reportTypes.${key}`)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.reportModalCancel} onPress={() => setShowReportModal(false)}>
              <Text style={styles.reportModalCancelText}>{t('location.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
  },
  dragArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  keyboardView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2D2D44',
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: { flex: 1, gap: 6 },
  catChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  catChipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  name: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeBtn: { paddingLeft: 12, paddingTop: 2 },
  closeBtnText: { color: '#8E8E8E', fontSize: 20 },

  carouselWrap: { marginBottom: 14, borderRadius: 12, overflow: 'hidden' },
  carouselImg: { width: '100%', height: 180 },
  carouselControls: {
    position: 'absolute', bottom: 8, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  carouselBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  carouselBtnText: { color: '#fff', fontSize: 22, lineHeight: 26 },
  carouselDots: { color: 'rgba(255,255,255,0.8)', fontSize: 10, letterSpacing: 2 },

  description: { color: '#ccc', fontSize: 15, lineHeight: 22, marginBottom: 14 },

  eventBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#0F0F1A', borderRadius: 10, padding: 12,
    marginBottom: 14, borderWidth: 1, borderColor: '#2D2D44',
  },
  eventIcon: { width: 18, height: 18, tintColor: '#22C55E' },
  eventLabel: { color: '#8E8E8E', fontSize: 11 },
  eventName: { color: '#22C55E', fontSize: 14, fontWeight: '600' },

  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 14 },
  metaItem: { flex: 1 },
  metaLabel: { color: '#8E8E8E', fontSize: 11, marginBottom: 2 },
  metaValue: { color: '#fff', fontSize: 13, fontWeight: '500' },

  likeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0F0F1A', borderRadius: 10, padding: 12,
    marginBottom: 20, borderWidth: 1, borderColor: '#2D2D44',
  },
  likeIcon: { width: 20, height: 20 },
  likeCount: { color: '#fff', fontSize: 16, fontWeight: '700' },
  likeLabel: { color: '#8E8E8E', fontSize: 13 },

  commentsSection: { marginBottom: 8 },
  commentsTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  comment: {
    backgroundColor: '#0F0F1A', borderRadius: 10, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#2D2D44',
  },
  commentAuthor: { color: '#22C55E', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  commentText: { color: '#ccc', fontSize: 14, lineHeight: 20 },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingTop: 10, paddingBottom: 16,
    borderTopWidth: 1, borderTopColor: '#2D2D44',
  },
  input: {
    flex: 1,
    backgroundColor: '#0F0F1A', borderWidth: 1, borderColor: '#2D2D44',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    color: '#fff', fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#2D2D44' },
  sendBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  reportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0F0F1A', borderRadius: 10, padding: 12,
    marginBottom: 20, borderWidth: 1, borderColor: '#EF444433',
  },
  reportBtnDisabled: { opacity: 0.4 },
  reportBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },

  reportModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  reportModalBox: {
    backgroundColor: '#1A1A2E', borderRadius: 16,
    padding: 20, width: 300, borderWidth: 1, borderColor: '#2D2D44',
  },
  reportModalTitle: {
    color: '#fff', fontSize: 16, fontWeight: '700',
    textAlign: 'center', marginBottom: 16,
  },
  reportModalOption: {
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2D2D44',
  },
  reportModalOptionText: { color: '#fff', fontSize: 15, textAlign: 'center' },
  reportModalCancel: {
    paddingVertical: 14, marginTop: 4,
  },
  reportModalCancelText: {
    color: '#8E8E8E', fontSize: 15, textAlign: 'center', fontWeight: '600',
  },
});
