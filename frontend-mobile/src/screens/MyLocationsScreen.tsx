import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocations, useAuth, Location } from '@pulse-map/shared';
import { Icons } from '../utils/icons';
import EditLocationModal from '../components/EditLocationModal';

type FilterType = 'all' | 'active' | 'expired' | 'review';

function LocationItem({
  location,
  isOwned,
  onEdit,
  onConfirm,
  onReject,
}: {
  location: Location;
  isOwned: boolean;
  onEdit: (loc: Location) => void;
  onConfirm: (loc: Location) => void;
  onReject: (loc: Location) => void;
}) {
  const expired = location.isExpired;

  return (
    <View style={[styles.card, expired && styles.cardExpired]}>
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardCategory}>{location.category}</Text>
          <View style={styles.nameRow}>
            <Text style={styles.cardName}>{location.name}</Text>
            {isOwned && (
              <View style={styles.ownedBadge}>
                <Image source={Icons.pin_owned} style={styles.ownedBadgeIcon} />
                <Text style={styles.ownedBadgeText}>Owned</Text>
              </View>
            )}
            {(location as any).requiresReview && (
              <View style={styles.reviewBadge}>
                <Image source={Icons.warning} style={styles.reviewBadgeIcon} />
                <Text style={styles.reviewBadgeText}>Review</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.cardTopRight}>
          <View style={[styles.statusBadge, expired ? styles.statusExpired : styles.statusActive]}>
            <Text style={styles.statusText}>{expired ? 'Expired' : 'Active'}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(location)}>
            <Text style={styles.editBtnText}>✏</Text>
          </TouchableOpacity>
        </View>
      </View>

      {(location as any).requiresReview && (location as any).event && (
        <View style={styles.reviewAlert}>
          <Text style={styles.reviewAlertTitle}>Event Assignment Pending Review</Text>
          <Text style={styles.reviewAlertText}>
            Event: {(location as any).event?.name}
          </Text>
          {(location as any).eventAssignmentConfidence !== undefined && (
            <Text style={styles.reviewAlertText}>
              Confidence: {((location as any).eventAssignmentConfidence * 100).toFixed(1)}%
            </Text>
          )}
          <View style={styles.reviewActions}>
            <TouchableOpacity style={styles.approveBtn} onPress={() => onConfirm(location)}>
              <Text style={styles.approveBtnText}>✓  Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject(location)}>
              <Text style={styles.rejectBtnText}>✕  Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {location.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {location.description}
        </Text>
      ) : null}

      <View style={styles.meta}>
        <View style={styles.metaItem}>
          <Image source={Icons.heart_empty} style={styles.metaIcon} />
          <Text style={styles.metaText}>{location.likesCount}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaText}>{location.messages?.length ?? 0} comments</Text>
        </View>
      </View>

    </View>
  );
}

export default function MyLocationsScreen() {
  const { allLocations, refreshLocations, confirmLocationEvent, rejectLocationEvent } = useLocations();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('active');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  useEffect(() => {
    refreshLocations(false);
  }, [refreshLocations]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshLocations(false);
    setRefreshing(false);
  };

  const handleConfirm = (location: Location) => {
    Alert.alert(
      'Approve Event Assignment',
      `Assign "${location.name}" to event "${(location as any).event?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await confirmLocationEvent(location.id);
              await refreshLocations(false);
            } catch {
              Alert.alert('Error', 'Failed to confirm event assignment');
            }
          },
        },
      ]
    );
  };

  const handleReject = (location: Location) => {
    Alert.alert(
      'Reject Event Assignment',
      `Remove "${location.name}" from event "${(location as any).event?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectLocationEvent(location.id);
              await refreshLocations(false);
            } catch {
              Alert.alert('Error', 'Failed to reject event assignment');
            }
          },
        },
      ]
    );
  };

  const myLocations = allLocations.filter(
    (l) => l.creator?.id === user?.id || l.owner?.id === user?.id
  );

  const filteredLocations = myLocations.filter((loc) => {
    if (filter === 'active') return !loc.isExpired;
    if (filter === 'expired') return loc.isExpired;
    if (filter === 'review') return (loc as any).requiresReview;
    return true;
  });

  const counts = {
    all: myLocations.length,
    active: myLocations.filter((l) => !l.isExpired).length,
    expired: myLocations.filter((l) => l.isExpired).length,
    review: myLocations.filter((l) => (l as any).requiresReview).length,
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'active', label: `Active (${counts.active})` },
    { key: 'expired', label: `Expired (${counts.expired})` },
    { key: 'review', label: `Review (${counts.review})` },
  ];

  return (
    <View style={styles.container}>
      {/* Fixed header + filter bar */}
      <View style={styles.topSection}>
        <Text style={styles.header}>My Locations</Text>

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterTab, filter === key && styles.filterTabActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[styles.filterTabText, filter === key && styles.filterTabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Scrollable list — flex: 1 so it fills remaining space and doesn't push header away */}
      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF6B35" />
        }
        contentContainerStyle={filteredLocations.length === 0 ? styles.emptyContainer : styles.listContent}
      >
        {filteredLocations.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {myLocations.length === 0 ? 'No locations yet' : 'No locations match this filter'}
            </Text>
            {myLocations.length === 0 && (
              <Text style={styles.emptySubtitle}>
                Tap the + button on the map to add your first location
              </Text>
            )}
          </View>
        ) : (
          filteredLocations.map((location) => (
            <LocationItem
              key={location.id}
              location={location}
              isOwned={location.owner?.id === user?.id}
              onEdit={setEditingLocation}
              onConfirm={handleConfirm}
              onReject={handleReject}
            />
          ))
        )}
      </ScrollView>

      {editingLocation && (
        <EditLocationModal
          visible={!!editingLocation}
          location={editingLocation}
          onClose={() => setEditingLocation(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  topSection: { flexShrink: 0 },
  header: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 12,
  },
  list: { flex: 1 },
  filterRow: {
    flexGrow: 0,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  filterTabActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterTabText: {
    color: '#8E8E8E',
    fontSize: 13,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: { paddingBottom: 20 },
  emptyContainer: { flexGrow: 1 },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
  },
  cardExpired: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-start' },
  cardTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editBtn: {
    backgroundColor: '#2D2D44',
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: { fontSize: 15 },
  cardInfo: { flex: 1 },
  cardCategory: { color: '#FF6B35', fontSize: 11, fontWeight: '600', marginBottom: 3 },
  nameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  cardName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  ownedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ownedBadgeIcon: { width: 11, height: 11, tintColor: '#FFD700' },
  ownedBadgeText: { color: '#FFD700', fontSize: 11 },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3D2E00',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reviewBadgeIcon: { width: 11, height: 11, tintColor: '#F59E0B' },
  reviewBadgeText: { color: '#F59E0B', fontSize: 11, fontWeight: '600' },
  reviewAlert: {
    backgroundColor: '#2D2000',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  reviewAlertTitle: { color: '#F59E0B', fontSize: 12, fontWeight: '600', marginBottom: 2 },
  reviewAlertText: { color: '#ccc', fontSize: 12 },
  reviewActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  approveBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  approveBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  rejectBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  rejectBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  statusActive: { backgroundColor: '#1B4D1B' },
  statusExpired: { backgroundColor: '#4D1B1B' },
  statusText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  description: { color: '#ccc', fontSize: 14, lineHeight: 19, marginBottom: 8 },
  meta: { flexDirection: 'row', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaIcon: { width: 13, height: 13, tintColor: '#8E8E8E' },
  metaText: { color: '#8E8E8E', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { color: '#8E8E8E', fontSize: 14, textAlign: 'center' },
});
