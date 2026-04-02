import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Icons } from '../utils/icons';
import { useDeviceLocation } from '../contexts/LocationContext';
import {
  fetchRecommendedLocationsByBounds,
  LocationRecommendationDTO,
  useAuth,
  useLocations,
  recordInteraction,
  InteractionType,
} from '@pulse-map/shared';

function RecommendationCard({
  item,
  onInteract,
}: {
  item: LocationRecommendationDTO;
  onInteract: (item: LocationRecommendationDTO) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardCategory}>{item.category}</Text>
          <View style={styles.cardScoreRow}>
            <Image source={Icons.star} style={styles.cardScoreIcon} />
            <Text style={styles.cardScore}>{(item.score * 10).toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.cardName}>{item.name}</Text>
      </View>
      {item.description ? (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <Text style={styles.cardReason}>{item.reason}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.cardLikesRow}>
          <Image source={Icons.heart_empty} style={styles.cardLikesIcon} />
          <Text style={styles.cardLikes}>{item.likesCount}</Text>
        </View>
        <TouchableOpacity style={styles.interactBtn} onPress={() => onInteract(item)}>
          <Text style={styles.interactBtnText}>I've been here</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RecommendationsScreen() {
  const { user, tokenService } = useAuth();
  const { interactedLocationIds, markAsInteracted } = useLocations();
  const { userCoords } = useDeviceLocation();
  const [recommendations, setRecommendations] = useState<LocationRecommendationDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!user || !userCoords) return;
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        const delta = 0.05;
        const bounds = {
          minLat: userCoords.latitude - delta,
          maxLat: userCoords.latitude + delta,
          minLng: userCoords.longitude - delta,
          maxLng: userCoords.longitude + delta,
        };
        const data = await fetchRecommendedLocationsByBounds(tokenService, bounds, user.id, 20);
        setRecommendations(data.filter((r) => !interactedLocationIds.has(r.id)));
      } catch (e) {
        console.error('Failed to load recommendations:', e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, tokenService, userCoords]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleInteract = async (item: LocationRecommendationDTO) => {
    if (!user) return;
    try {
      await recordInteraction(tokenService, {
        userId: user.id,
        locationId: item.id,
        type: InteractionType.Confirmed,
      });
    } catch {
      // 409 = already interacted — still remove from list
    } finally {
      markAsInteracted(item.id);
      setRecommendations((prev) => prev.filter((r) => r.id !== item.id));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Finding recommendations near you...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recommended for you</Text>
      <FlatList
        data={recommendations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RecommendationCard item={item} onInteract={handleInteract} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor="#FF6B35"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No recommendations yet</Text>
            <Text style={styles.emptySubtitle}>
              Like some locations to improve your recommendations
            </Text>
          </View>
        }
        contentContainerStyle={recommendations.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F1A' },
  center: { flex: 1, backgroundColor: '#0F0F1A', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#8E8E8E', marginTop: 12, fontSize: 14 },
  header: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 12,
  },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: { marginBottom: 8 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardCategory: { color: '#FF6B35', fontSize: 12, fontWeight: '600' },
  cardScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardScoreIcon: { width: 12, height: 12, tintColor: '#FFD700' },
  cardScore: { color: '#FFD700', fontSize: 12, fontWeight: '600' },
  cardName: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  cardDescription: { color: '#ccc', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  cardReason: { color: '#8E8E8E', fontSize: 12, fontStyle: 'italic', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLikesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardLikesIcon: { width: 14, height: 14, tintColor: '#8E8E8E' },
  cardLikes: { color: '#8E8E8E', fontSize: 14 },
  interactBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  interactBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyList: { flex: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { color: '#8E8E8E', fontSize: 14, textAlign: 'center' },
});
