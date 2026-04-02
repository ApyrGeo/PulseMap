import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import {
  fetchMyInteractions,
  fetchLeaderboard,
  fetchTopLocations,
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
  TouchApp,
} from '@mui/icons-material';

const DARK = {
  bg: '#0F0F1A',
  surface: '#1A1A2E',
  border: '#2D2D44',
  accent: '#FF6B35',
  text: '#ffffff',
  muted: '#8E8E8E',
};

const medalIcons = ['/icons/medal_gold.png', '/icons/medal_silver.png', '/icons/medal_bronze.png'];

function MyStatsTab({
  userId,
}: {
  userId: number;
}) {
  const [interactions, setInteractions] = useState<InteractionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyInteractions(userId)
      .then(setInteractions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const confirmed = interactions.filter((i) => i.type === 0).length;
  const taps = interactions.filter((i) => i.type === 1).length;

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress sx={{ color: DARK.accent }} /></Box>;

  return (
    <Box>
      {/* Summary row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
        {[
          { label: 'Total Visits', value: interactions.length, icon: '/icons/location.png' },
          { label: 'Confirmed', value: confirmed, icon: '/icons/check.png' },
          { label: 'Proximity Taps', value: taps, icon: '/icons/tap.png' },
        ].map((stat) => (
          <Card key={stat.label} sx={{ backgroundColor: DARK.surface, border: `1px solid ${DARK.border}` }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <img src={stat.icon} style={{ width: 28, height: 28 }} alt="" />
              <Typography variant="h4" sx={{ color: DARK.accent, fontWeight: 700 }}>{stat.value}</Typography>
              <Typography variant="body2" sx={{ color: DARK.muted }}>{stat.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Interaction list */}
      {interactions.length === 0 ? (
        <Card sx={{ backgroundColor: DARK.surface, border: `1px solid ${DARK.border}` }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <Typography sx={{ color: DARK.text, fontSize: 18, fontWeight: 600 }}>No interactions yet</Typography>
            <Typography sx={{ color: DARK.muted, mt: 1 }}>Walk near locations and confirm your visits to see them here</Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {interactions.map((item) => (
            <Card key={item.id} sx={{ backgroundColor: DARK.surface, border: `1px solid ${DARK.border}` }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: '12px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  {item.type === 0
                    ? <CheckCircle sx={{ color: '#4CAF50', fontSize: 20 }} />
                    : <TouchApp sx={{ color: DARK.accent, fontSize: 20 }} />}
                  <Box>
                    <Typography sx={{ color: DARK.text, fontWeight: 600, fontSize: 14 }}>{item.locationName}</Typography>
                    <Typography sx={{ color: DARK.muted, fontSize: 12 }}>
                      {item.type === 0 ? 'Confirmed visit' : 'Proximity tap'}
                    </Typography>
                  </Box>
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
              Your rank: #{myRank + 1} with {users[myRank].totalInteractions} interactions
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
                label={`${user.totalInteractions} visits`}
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
              label={`${loc.totalInteractions} visits`}
              size="small"
              sx={{ backgroundColor: '#2D1A10', color: DARK.accent, fontWeight: 700, border: `1px solid ${DARK.accent}` }}
            />
          </CardContent>
        </Card>
      ))}
      {locations.length === 0 && (
        <Card sx={{ backgroundColor: DARK.surface, border: `1px solid ${DARK.border}` }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <Typography sx={{ color: DARK.muted }}>No hot spots data yet</Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default function UserStatisticsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);

  if (!user) return null;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 3, px: 2 }}>
      <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mb: 3 }}>
        Statistics
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
        <Tab label="My Stats" />
        <Tab label="Leaderboard" />
        <Tab label="Hot Spots" />
      </Tabs>

      {tab === 0 && <MyStatsTab userId={user.id} />}
      {tab === 1 && <LeaderboardTab currentUserId={user.id} />}
      {tab === 2 && <HotSpotsTab />}
    </Box>
  );
}
