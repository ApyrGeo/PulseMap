import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SectionList,
} from 'react-native';
import { useLocations, useAuth, Location } from '@pulse-map/shared';

function LocationItem({
  location,
  isOwned,
  onExpire,
  onExtend,
}: {
  location: Location;
  isOwned: boolean;
  onExpire: (id: number) => void;
  onExtend: (id: number) => void;
}) {
  const expired = location.isExpired;

  return (
    <View style={[styles.card, expired && styles.cardExpired]}>
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardCategory}>{location.category}</Text>
          <Text style={styles.cardName}>{location.name}</Text>
          {isOwned && <Text style={styles.ownedBadge}>📌 Owned</Text>}
        </View>
        <View style={[styles.statusBadge, expired ? styles.statusExpired : styles.statusActive]}>
          <Text style={styles.statusText}>{expired ? 'Expired' : 'Active'}</Text>
        </View>
      </View>

      {location.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {location.description}
        </Text>
      ) : null}

      <View style={styles.meta}>
        <Text style={styles.metaText}>🤍 {location.likesCount}</Text>
        <Text style={styles.metaText}>💬 {location.messages?.length ?? 0}</Text>
      </View>

      {!expired ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.expireBtn]}
            onPress={() =>
              Alert.alert('Expire Location', 'Mark this location as expired?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Expire', style: 'destructive', onPress: () => onExpire(location.id) },
              ])
            }
          >
            <Text style={styles.expireBtnText}>Expire</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.extendBtn]}
            onPress={() => onExtend(location.id)}
          >
            <Text style={styles.extendBtnText}>Extend +1h</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

export default function MyLocationsScreen() {
  const { allLocations, refreshLocations, expireLocationById, extendLocationById } = useLocations();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshLocations(false);
  }, [refreshLocations]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshLocations(false);
    setRefreshing(false);
  };

  const createdLocations = allLocations.filter((l) => l.creator?.id === user?.id);
  const ownedLocations = allLocations.filter(
    (l) => l.owner?.id === user?.id && l.creator?.id !== user?.id
  );

  const sections = [
    { title: 'Created by me', data: createdLocations },
    { title: 'Owned by me', data: ownedLocations },
  ].filter((s) => s.data.length > 0);

  if (sections.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>My Locations</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No locations yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button on the map to add your first location
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Locations</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, section }) => (
          <LocationItem
            location={item}
            isOwned={section.title === 'Owned by me'}
            onExpire={expireLocationById}
            onExtend={extendLocationById}
          />
        )}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF6B35"
          />
        }
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  header: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 12,
  },
  sectionHeader: {
    color: '#8E8E8E',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
  },
  cardExpired: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardInfo: { flex: 1 },
  cardCategory: { color: '#FF6B35', fontSize: 11, fontWeight: '600', marginBottom: 3 },
  cardName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 3 },
  ownedBadge: { color: '#FFD700', fontSize: 11 },
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
  meta: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  metaText: { color: '#8E8E8E', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  expireBtn: { backgroundColor: '#3D1A1A' },
  expireBtnText: { color: '#FF5252', fontSize: 13, fontWeight: '600' },
  extendBtn: { backgroundColor: '#1A2D1A' },
  extendBtnText: { color: '#4CAF50', fontSize: 13, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { color: '#8E8E8E', fontSize: 14, textAlign: 'center' },
});
