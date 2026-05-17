import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  useAuth,
  fetchLocations,
  getUserInteractions,
  fetchLeaderboard,
  fetchTopLocations,
  InteractionResponseDTO,
  UserInteractionStatsDTO,
  LocationInteractionStatsDTO,
  InteractionType,
} from '@pulse-map/shared';
import { useTranslation } from 'react-i18next';
import { Icons } from '../utils/icons';

type Tab = 'my' | 'leaderboard' | 'locations';

function MyStatsTab({
  interactions,
  uploadedCount,
  loading,
  onRefresh,
  refreshing,
}: {
  interactions: InteractionResponseDTO[];
  uploadedCount: number;
  loading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const { t } = useTranslation();

  const visitedCount = interactions.filter((i) => i.type === InteractionType.Confirmed).length;

  const header = (
    <View style={styles.summaryRow}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>{visitedCount}</Text>
        <Text style={styles.summaryLabel}>{t('statistics.locationsVisited')}</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>{uploadedCount}</Text>
        <Text style={styles.summaryLabel}>{t('statistics.locationsUploaded')}</Text>
      </View>
    </View>
  );

  if (loading) return (
    <>
      {header}
      <ActivityIndicator style={styles.loader} size="large" color="#22C55E" />
    </>
  );

  return (
    <FlatList
      data={interactions.filter((i) => i.type === InteractionType.Confirmed)}
      ListHeaderComponent={header}
      keyExtractor={(item) => item.id.toString()}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.cardName}>{item.locationName}</Text>
          <View style={styles.cardRow}>
            <View style={styles.cardTypeRow}>
              <Image
                source={item.type === InteractionType.Confirmed ? Icons.check : Icons.tap}
                style={styles.cardTypeIcon}
              />
              <Text style={styles.cardType}>
                {item.type === InteractionType.Confirmed ? t('statistics.visited') : t('statistics.proximityTap')}
              </Text>
            </View>
            <Text style={styles.cardDate}>
              {new Date(item.interactedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t('statistics.noInteractions')}</Text>
          <Text style={styles.emptySubtitle}>{t('statistics.noInteractionsHint')}</Text>
        </View>
      }
      contentContainerStyle={interactions.length === 0 ? styles.emptyList : undefined}
    />
  );
}

function LeaderboardTab({
  users,
  loading,
  currentUserId,
}: {
  users: UserInteractionStatsDTO[];
  loading: boolean;
  currentUserId?: number;
}) {
  const { t } = useTranslation();
  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#22C55E" />;

  const medalIcons = [Icons.medal_gold, Icons.medal_silver, Icons.medal_bronze];

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.userId.toString()}
      renderItem={({ item, index }) => (
        <View
          style={[
            styles.card,
            item.userId === currentUserId && styles.cardHighlighted,
          ]}
        >
          <View style={styles.rankRow}>
            {index < 3 ? (
              <Image source={medalIcons[index]} style={styles.medal} />
            ) : (
              <Text style={styles.rankNum}>#{index + 1}</Text>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.cardName}>
                {item.firstName} {item.lastName}
              </Text>
              <Text style={styles.username}>@{item.username}</Text>
            </View>
            <Text style={styles.interactionCount}>{item.totalInteractions}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t('statistics.noData')}</Text>
        </View>
      }
    />
  );
}

function TopLocationsTab({
  locations,
  loading,
}: {
  locations: LocationInteractionStatsDTO[];
  loading: boolean;
}) {
  const { t } = useTranslation();
  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#22C55E" />;

  return (
    <FlatList
      data={locations}
      keyExtractor={(item) => item.locationId.toString()}
      renderItem={({ item, index }) => (
        <View style={styles.card}>
          <View style={styles.rankRow}>
            <Text style={styles.rankNum}>#{index + 1}</Text>
            <View style={styles.userInfo}>
              <Text style={styles.cardName}>{item.locationName}</Text>
            </View>
            <Text style={styles.interactionCount}>{item.totalInteractions} {t('statistics.visits')}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>{t('statistics.noData')}</Text>
        </View>
      }
    />
  );
}

export default function StatisticsScreen() {
  const { user, tokenService } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('my');
  const [myInteractions, setMyInteractions] = useState<InteractionResponseDTO[]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<UserInteractionStatsDTO[]>([]);
  const [topLocations, setTopLocations] = useState<LocationInteractionStatsDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (tab: Tab, isRefresh = false) => {
    if (!user) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      if (tab === 'my') {
        const [interactions, allLocs] = await Promise.all([
          getUserInteractions(tokenService, user.id),
          fetchLocations(tokenService, false, user.id),
        ]);
        setMyInteractions(interactions);
        setUploadedCount(
          allLocs.filter(
            (loc) => loc.creator?.id === user.id || loc.owner?.id === user.id
          ).length
        );
      } else if (tab === 'leaderboard') {
        const data = await fetchLeaderboard(20);
        setLeaderboard(data);
      } else {
        const data = await fetchTopLocations(20);
        setTopLocations(data);
      }
    } catch (e) {
      console.error('Failed to load statistics:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, user]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'my', label: t('statistics.myStats') },
    { id: 'leaderboard', label: t('statistics.leaderboard') },
    { id: 'locations', label: t('statistics.hotSpots') },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('statistics.title')}</Text>

      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'my' && (
        <MyStatsTab
          interactions={myInteractions}
          uploadedCount={uploadedCount}
          loading={loading}
          onRefresh={() => loadData('my', true)}
          refreshing={refreshing}
        />
      )}
      {activeTab === 'leaderboard' && (
        <LeaderboardTab
          users={leaderboard}
          loading={loading}
          currentUserId={user?.id}
        />
      )}
      {activeTab === 'locations' && (
        <TopLocationsTab locations={topLocations} loading={loading} />
      )}
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
    paddingTop: 52,
    paddingBottom: 12,
  },
  loader: { marginTop: 40 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#22C55E' },
  tabText: { color: '#8E8E8E', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
  },
  cardHighlighted: { borderWidth: 1, borderColor: '#22C55E' },
  cardName: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardTypeIcon: { width: 13, height: 13, tintColor: '#8E8E8E' },
  cardType: { color: '#8E8E8E', fontSize: 13 },
  cardDate: { color: '#8E8E8E', fontSize: 13 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medal: { width: 26, height: 26 },
  rankNum: { color: '#8E8E8E', fontSize: 16, fontWeight: '600', width: 28 },
  userInfo: { flex: 1 },
  username: { color: '#8E8E8E', fontSize: 12 },
  interactionCount: { color: '#22C55E', fontWeight: '700', fontSize: 15 },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  summaryValue: {
    color: '#22C55E',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#8E8E8E',
    fontSize: 12,
    textAlign: 'center',
  },
  empty: { alignItems: 'center', padding: 40 },
  emptyList: { flex: 1, justifyContent: 'center' },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptySubtitle: { color: '#8E8E8E', fontSize: 14, textAlign: 'center' },
});
