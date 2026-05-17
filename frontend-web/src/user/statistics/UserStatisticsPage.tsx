import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthProvider';
import {
  fetchMyInteractions,
  fetchLeaderboard,
  fetchTopLocations,
  fetchUserLocationCount,
  InteractionRecord,
  UserInteractionStats,
  LocationInteractionStats,
} from './services/UserStatisticsApiService';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tab,
  Tabs,
  CircularProgress,
  Chip,
  Avatar,
} from '@mui/material';
import {
  EmojiEvents,
  Place,
  CheckCircle,
  CloudUpload,
} from '@mui/icons-material';

const DARK = {
  bg: '#0F0F1A',
  surface: '#1A1A2E',
  border: '#2D2D44',
  accent: '#22C55E',
  text: '#ffffff',
  muted: '#8E8E8E',
};

const medalIcons = ['/icons/medal_gold.png', '/icons/medal_silver.png', '/icons/medal_bronze.png'];

function MyStatsTab({ userId }: { userId: number }) {
  const { t } = useTranslation();
  const [interactions, setInteractions] = useState<InteractionRecord[]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchMyInteractions(userId),
      fetchUserLocationCount(userId),
    ])
      .then(([interactionsData, count]) => {
        setInteractions(interactionsData);
        setUploadedCount(count);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const visitedCount = interactions.filter((i) => i.type === 0).length;

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress sx={{ color: DARK.accent }} /></Box>;

  return (
    <Box>
      {/* Summary row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
        <Card sx={{ backgroundColor: DARK.surface, border: `1px solid ${DARK.border}` }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ color: DARK.accent, fontSize: 28, mb: 0.5 }} />
            <Typography variant="h4" sx={{ color: DARK.accent, fontWeight: 700 }}>{visitedCount}</Typography>
            <Typography variant="body2" sx={{ color: DARK.muted }}>{t('statistics.locationsVisited')}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ backgroundColor: DARK.surface, border: `1px solid ${DARK.border}` }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <CloudUpload sx={{ color: DARK.accent, fontSize: 28, mb: 0.5 }} />
            <Typography variant="h4" sx={{ color: DARK.accent, fontWeight: 700 }}>{uploadedCount}</Typography>
            <Typography variant="body2" sx={{ color: DARK.muted }}>{t('statistics.locationsUploaded')}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Visited locations list */}
      {interactions.length === 0 ? (
        <Card sx={{ backgroundColor: DARK.surface, border: `1px solid ${DARK.border}` }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <Typography sx={{ color: DARK.text, fontSize: 18, fontWeight: 600 }}>{t('statistics.noInteractions')}</Typography>
            <Typography sx={{ color: DARK.muted, mt: 1 }}>{t('statistics.noInteractionsHint')}</Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {interactions.filter((i) => i.type === 0).map((item) => (
            <Card key={item.id} sx={{ backgroundColor: DARK.surface, border: `1px solid ${DARK.border}` }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: '12px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircle sx={{ color: '#4CAF50', fontSize: 20 }} />
                  <Typography sx={{ color: DARK.text, fontWeight: 600, fontSize: 14 }}>{item.locationName}</Typography>
                </Box>
                <Typography sx={{ color: DARK.muted, fontSize: 12 }}>
                  {new Date(item.interactedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

function LeaderboardTab({ currentUserId }: { currentUserId: number }) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserInteractionStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard(20)
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress sx={{ color: DARK.accent }} /></Box>;

  const myRank = users.findIndex((u) => u.userId === currentUserId);

  return (
    <Box>
      {myRank >= 0 && (
        <Card sx={{ backgroundColor: '#1F1420', border: `1px solid ${DARK.accent}`, mb: 2 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
            <EmojiEvents sx={{ color: DARK.accent }} />
            <Typography sx={{ color: DARK.text, fontWeight: 600 }}>
              {t('statistics.yourRank', { rank: myRank + 1, count: users[myRank].totalInteractions })}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {users.map((user, index) => (
          <Card
            key={user.userId}
            sx={{
              backgroundColor: user.userId === currentUserId ? '#1F1A30' : DARK.surface,
              border: `1px solid ${user.userId === currentUserId ? DARK.accent : DARK.border}`,
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
              {index < 3 ? (
                <img src={medalIcons[index]} style={{ width: 28, height: 28 }} alt="" />
              ) : (
                <Typography sx={{ color: DARK.muted, fontWeight: 700, fontSize: 15, width: 36, textAlign: 'center' }}>
                  #{index + 1}
                </Typography>
              )}
              <Avatar sx={{ bgcolor: DARK.accent, width: 36, height: 36, fontSize: 14 }}>
                {user.firstName[0]}{user.lastName[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: DARK.text, fontWeight: 600, fontSize: 14 }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography sx={{ color: DARK.muted, fontSize: 12 }}>@{user.username}</Typography>
              </Box>
              <Chip
                label={`${user.totalInteractions} ${t('statistics.visits')}`}
                size="small"
                sx={{ backgroundColor: '#2D1A10', color: DARK.accent, fontWeight: 700, border: `1px solid ${DARK.accent}` }}
              />
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

function HotSpotsTab() {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<LocationInteractionStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopLocations(20)
      .then(setLocations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress sx={{ color: DARK.accent }} /></Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {locations.map((loc, index) => (
        <Card key={loc.locationId} sx={{ backgroundColor: DARK.surface, border: `1px solid ${DARK.border}` }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
            <Typography sx={{ color: DARK.muted, fontWeight: 700, fontSize: 15, width: 32 }}>
              #{index + 1}
            </Typography>
            <Place sx={{ color: DARK.accent, fontSize: 20 }} />
            <Typography sx={{ color: DARK.text, fontWeight: 600, fontSize: 14, flex: 1 }}>
              {loc.locationName}
            </Typography>
            <Chip
              label={`${loc.totalInteractions} ${t('statistics.visits')}`}
              size="small"
              sx={{ backgroundColor: '#2D1A10', color: DARK.accent, fontWeight: 700, border: `1px solid ${DARK.accent}` }}
            />
          </CardContent>
        </Card>
      ))}
      {locations.length === 0 && (
        <Card sx={{ backgroundColor: DARK.surface, border: `1px solid ${DARK.border}` }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <Typography sx={{ color: DARK.muted }}>{t('statistics.noHotSpots')}</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default function UserStatisticsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState(0);

  if (!user) return null;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 3, px: 2 }}>
      <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 3 }}>
        {t('statistics.title')}
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { color: DARK.muted, fontWeight: 600 },
          '& .Mui-selected': { color: DARK.accent },
          '& .MuiTabs-indicator': { backgroundColor: DARK.accent },
          borderBottom: `1px solid ${DARK.border}`,
        }}
      >
        <Tab label={t('statistics.myStats')} />
        <Tab label={t('statistics.leaderboard')} />
        <Tab label={t('statistics.hotSpots')} />
      </Tabs>

      {tab === 0 && <MyStatsTab userId={user.id} />}
      {tab === 1 && <LeaderboardTab currentUserId={user.id} />}
      {tab === 2 && <HotSpotsTab />}
    </Box>
  );
}
