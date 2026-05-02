import React, { useState, useCallback, useRef } from 'react';
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Icons } from '../utils/icons';
import TipCard from '../components/TipCard';
import { useDeviceLocation } from '../contexts/LocationContext';
import {
  fetchRecommendedLocationsByBounds,
  LocationRecommendationDTO,
  useAuth,
  useLocations,
} from '@pulse-map/shared';

function RecommendationCard({
  item,
  onPress,
}: {
  item: LocationRecommendationDTO;
  onPress: (item: LocationRecommendationDTO) => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.75}>
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
      <View style={styles.cardLikesRow}>
        <Image source={Icons.heart_empty} style={styles.cardLikesIcon} />
        <Text style={styles.cardLikes}>{item.likesCount}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function RecommendationsScreen() {
  const navigation = useNavigation<any>();
  const { user, tokenService } = useAuth();
  const { interactedLocationIds } = useLocations();
  const { userCoords } = useDeviceLocation();
  const { t } = useTranslation();
  const [recommendations, setRecommendations] = useState<LocationRecommendationDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const userCoordsRef = useRef(userCoords);
  userCoordsRef.current = userCoords;

  const load = useCallback(
    async (isRefresh = false) => {
      if (!user) return;
      const coords = userCoordsRef.current;
      if (!coords) return;
      isRefresh ? setRefreshing(true) : setLoading(true);
      try {
        const delta = 0.05;
        const bounds = {
          minLat: coords.latitude - delta,
          maxLat: coords.latitude + delta,
          minLng: coords.longitude - delta,
          maxLng: coords.longitude + delta,
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
    [user, tokenService, interactedLocationIds]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCardPress = useCallback(
    (item: LocationRecommendationDTO) => {
      navigation.navigate('Map', {
        focusLocationId: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
      });
    },
    [navigation]
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>{t('recommendations.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('recommendations.title')}</Text>
      <TipCard message={t('tips.mobRecs')} />
      <FlatList
        data={recommendations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <RecommendationCard item={item} onPress={handleCardPress} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor="#22C55E"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>{t('recommendations.noRecommendations')}</Text>
            <Text style={styles.emptySubtitle}>{t('recommendations.noRecommendationsHint')}</Text>
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
    paddingTop: 52,
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
  cardCategory: { color: '#22C55E', fontSize: 12, fontWeight: '600' },
  cardScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardScoreIcon: { width: 12, height: 12, tintColor: '#FFD700' },
  cardScore: { color: '#FFD700', fontSize: 12, fontWeight: '600' },
  cardName: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  cardDescription: { color: '#ccc', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  cardReason: { color: '#8E8E8E', fontSize: 12, fontStyle: 'italic', marginBottom: 8 },
  cardLikesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardLikesIcon: { width: 14, height: 14, tintColor: '#8E8E8E' },
  cardLikes: { color: '#8E8E8E', fontSize: 14 },
  emptyList: { flex: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { color: '#8E8E8E', fontSize: 14, textAlign: 'center' },
});
