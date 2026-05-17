import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CategoryDTO, CategoryPostDTO, Location } from '../../shared/maps/Interfaces';
import {
  addCategory,
  fetchCategories,
} from '../../shared/maps/services/CategoriesApiService';
import {
  checkAndMergeDuplicates,
  forceMergeLocations,
  CheckMergeResponse,
  ForceMergeRequest,
} from '../map/services/AIApiService';
import {
  getStarredLocations,
  seedStarredLocations,
  SeedResultDTO,
} from '../../shared/maps/services/LocationsApiService';
import {
  triggerCheckExpiredLocations,
  triggerCheckExpiredEvents,
  triggerExtendDurationByLikes,
  triggerCheckMergeDuplicates,
  triggerAnalyzeAndClusterEvents,
} from '../jobs/JobsApiService';
import MergeResultItemComponent from '../map/components/MergeResultItem';
import ForceMergeModal from '../map/components/ForceMergeModal';
import EventDetectionPanel from '../events/components/EventDetectionPanel';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';

const AdminSettingsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  // Categories state
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');

  // Jobs state
  const [jobLoading, setJobLoading] = useState<string | null>(null);
  const [jobMessage, setJobMessage] = useState<string | null>(null);

  // Seeder state
  const [starredLocations, setStarredLocations] = useState<Location[]>([]);
  const [seederLoading, setSeederLoading] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResultDTO | null>(null);
  const [seederError, setSeederError] = useState<string | null>(null);

  // Deduplicare state
  const [maxDistance, setMaxDistance] = useState<number>(20);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [results, setResults] = useState<CheckMergeResponse | null>(null);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [forceMergeOpen, setForceMergeOpen] = useState(false);
  const [selectedLocation1, setSelectedLocation1] = useState<number | null>(null);
  const [selectedLocation2, setSelectedLocation2] = useState<number | null>(null);

  const handleTriggerJob = async (jobId: string, fn: () => Promise<void>) => {
    setJobLoading(jobId);
    setJobMessage(null);
    try {
      await fn();
      setJobMessage(`✓ ${t('adminSettings.jobEnqueued', { id: jobId })}`);
    } catch {
      setJobMessage(`✗ ${t('adminSettings.jobFailed', { id: jobId })}`);
    } finally {
      setJobLoading(null);
    }
  };

  const loadStarredLocations = async () => {
    try {
      const data = await getStarredLocations();
      setStarredLocations(data);
    } catch (error) {
      console.error('Failed to load starred locations', error);
    }
  };

  const handleRunSeeder = async () => {
    setSeederLoading(true);
    setSeederError(null);
    setSeedResult(null);
    try {
      const result = await seedStarredLocations();
      setSeedResult(result);
      await loadStarredLocations();
    } catch (error) {
      console.error('Seeder failed', error);
      setSeederError(t('adminSettings.seederFailed'));
    } finally {
      setSeederLoading(false);
    }
  };

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCategories(false);
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
    void loadStarredLocations();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const payload: CategoryPostDTO = {
      name: trimmedName,
      isActive: true,
      sortOrder: categories.length,
    };
    setIsSaving(true);
    try {
      await addCategory(payload);
      setName('');
      await loadCategories();
    } catch (error) {
      console.error('Failed to add category', error);
      alert(t('adminSettings.addCategoryError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckMerge = async () => {
    setMergeLoading(true);
    setMergeError(null);
    setResults(null);
    try {
      const response = await checkAndMergeDuplicates(maxDistance);
      setResults(response);
    } catch (err) {
      setMergeError('Failed to check and merge duplicates');
      console.error(err);
    } finally {
      setMergeLoading(false);
    }
  };

  const handleOpenForceMerge = (location1Id: number, location2Id: number) => {
    setSelectedLocation1(location1Id);
    setSelectedLocation2(location2Id);
    setForceMergeOpen(true);
  };

  const handleForceMerge = async (request: ForceMergeRequest) => {
    try {
      await forceMergeLocations(request);
      await handleCheckMerge();
      setForceMergeOpen(false);
    } catch (err) {
      console.error('Force merge failed', err);
      throw err;
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16, color: '#fff' }}>
        {t('adminSettings.title')}
      </h1>

      <Box sx={{ borderBottom: 1, borderColor: '#2D2D44', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v: number) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': { color: '#8E8E8E', textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { color: '#22C55E !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#22C55E' },
          }}
        >
          <Tab label={t('adminSettings.tabCategories')} />
          <Tab label={t('adminSettings.tabDeduplicate')} />
          <Tab label={t('adminSettings.tabSeeder')} />
          <Tab label={t('adminSettings.tabJobs')} />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <>
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1A1A2E', border: '1px solid #2D2D44' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
              {t('adminSettings.categoriesTitle')}
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <TextField
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('adminSettings.categoryPlaceholder')}
                required
                size="small"
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#0F0F1A',
                    color: '#fff',
                    '& fieldset': { borderColor: '#2D2D44' },
                    '&:hover fieldset': { borderColor: '#4D4D64' },
                    '&.Mui-focused fieldset': { borderColor: '#22C55E' },
                  },
                  '& input': { color: '#fff' },
                  '& input::placeholder': { color: '#8E8E8E', opacity: 1 },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={isSaving}
                startIcon={isSaving ? <CircularProgress size={18} /> : null}
                sx={{
                  backgroundColor: '#22C55E',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#16A34A' },
                  '&.Mui-disabled': { backgroundColor: '#2D2D44', color: '#8E8E8E' },
                }}
              >
                {isSaving ? t('adminSettings.adding') : t('adminSettings.addCategory')}
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, backgroundColor: '#1A1A2E', border: '1px solid #2D2D44' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
              {t('adminSettings.existingCategories')}
            </Typography>
            {isLoading ? (
              <Typography variant="body2" sx={{ color: '#8E8E8E' }}>{t('adminSettings.loadingCategories')}</Typography>
            ) : categories.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#8E8E8E' }}>{t('adminSettings.noCategories')}</Typography>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {[t('adminSettings.colName'), t('adminSettings.colSlug'), t('adminSettings.colActive'), t('adminSettings.colOrder')].map((col) => (
                        <TableCell key={col} sx={{ color: '#8E8E8E', fontWeight: 600, borderColor: '#2D2D44', fontSize: '0.8rem' }}>
                          {col}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell sx={{ color: '#fff', borderColor: '#2D2D44' }}>{category.name}</TableCell>
                        <TableCell sx={{ color: '#fff', borderColor: '#2D2D44' }}>{category.slug}</TableCell>
                        <TableCell sx={{ borderColor: '#2D2D44' }}>
                          <Typography variant="body2" sx={{ color: category.isActive ? '#10B981' : '#8E8E8E', fontWeight: 600 }}>
                            {category.isActive ? t('adminSettings.yes') : t('adminSettings.no')}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: '#fff', borderColor: '#2D2D44' }}>{category.sortOrder}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>
        </>
      )}

      {activeTab === 1 && (
        <Box>
          <EventDetectionPanel />

          <Paper sx={{ p: 3, mb: 3, mt: 3, backgroundColor: '#1A1A2E', border: '1px solid #2D2D44' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
              {t('adminSettings.checkMergeTitle')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label={t('adminSettings.maxDistance')}
                type="number"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                size="small"
                sx={{
                  width: 200,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#0F0F1A',
                    color: '#fff',
                    '& fieldset': { borderColor: '#2D2D44' },
                    '&:hover fieldset': { borderColor: '#4D4D64' },
                    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
                  },
                  '& .MuiInputLabel-root': { color: '#8E8E8E' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
                  '& input': { color: '#fff' },
                }}
              />
              <Button
                variant="contained"
                onClick={handleCheckMerge}
                disabled={mergeLoading}
                startIcon={mergeLoading ? <CircularProgress size={20} /> : null}
                sx={{
                  backgroundColor: '#3b82f6',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#2563eb' },
                  '&.Mui-disabled': { backgroundColor: '#2D2D44', color: '#8E8E8E' },
                }}
              >
                {mergeLoading ? t('adminSettings.checking') : t('adminSettings.checkMerge')}
              </Button>
            </Box>
          </Paper>

          {mergeError && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                backgroundColor: '#4D1B1B',
                border: '1px solid #FF6B6B',
                color: '#FF6B6B',
                '& .MuiAlert-icon': { color: '#FF6B6B' },
              }}
            >
              {mergeError}
            </Alert>
          )}

          {results && (
            <Paper sx={{ p: 3, backgroundColor: '#1A1A2E', border: '1px solid #2D2D44' }}>
              <Typography variant="h6" sx={{ mb: 1, color: '#fff' }}>
                {t('adminSettings.results')}
              </Typography>
              <Alert
                severity="info"
                sx={{
                  mb: 2,
                  backgroundColor: '#0F1F18',
                  border: '1px solid #10B981',
                  color: '#10B981',
                  '& .MuiAlert-icon': { color: '#10B981' },
                }}
              >
                {results.message}
              </Alert>

              {results.results && results.results.length > 0 ? (
                <>
                  <Divider sx={{ mb: 2, borderColor: '#2D2D44' }} />
                  <Box>
                    {results.results.map((result, index) => (
                      <MergeResultItemComponent
                        key={index}
                        result={result}
                        onForceMerge={handleOpenForceMerge}
                      />
                    ))}
                  </Box>
                </>
              ) : (
                <Typography variant="body2" sx={{ color: '#8E8E8E' }}>
                  {t('adminSettings.noResults')}
                </Typography>
              )}
            </Paper>
          )}

          {forceMergeOpen && selectedLocation1 && selectedLocation2 && (
            <ForceMergeModal
              isOpen={forceMergeOpen}
              location1Id={selectedLocation1}
              location2Id={selectedLocation2}
              onClose={() => setForceMergeOpen(false)}
              onConfirm={handleForceMerge}
            />
          )}
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1A1A2E', border: '1px solid #2D2D44' }}>
            <Typography variant="h6" sx={{ mb: 1, color: '#fff' }}>
              {t('adminSettings.seederTitle')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#8E8E8E' }}>
              {t('adminSettings.seederDesc')}
            </Typography>

            {starredLocations.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2, backgroundColor: '#0F1F18', border: '1px solid #10B981', color: '#10B981', '& .MuiAlert-icon': { color: '#10B981' } }}>
                {t('adminSettings.noStarred')}
              </Alert>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, color: '#B0B0B0' }}>
                  {t('adminSettings.starredCount', { count: starredLocations.length })}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {starredLocations.map((loc) => (
                    <Box key={loc.id} sx={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#0F0F1A', borderRadius: 1, px: 2, py: 1, border: '1px solid #2D2D44' }}>
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                        ★ {loc.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8E8E8E' }}>
                        {loc.category}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Button
              variant="contained"
              onClick={handleRunSeeder}
              disabled={seederLoading || starredLocations.length === 0}
              startIcon={seederLoading ? <CircularProgress size={20} /> : null}
              sx={{
                backgroundColor: '#3b82f6',
                '&:hover': { backgroundColor: '#2563eb' },
                '&.Mui-disabled': { backgroundColor: '#2D2D44', color: '#8E8E8E' },
              }}
            >
              {seederLoading ? t('adminSettings.running') : t('adminSettings.runSeeder')}
            </Button>
          </Paper>

          {seederError && (
            <Alert severity="error" sx={{ mb: 2, backgroundColor: '#4D1B1B', border: '1px solid #FF6B6B', color: '#FF6B6B', '& .MuiAlert-icon': { color: '#FF6B6B' } }}>
              {seederError}
            </Alert>
          )}

          {seedResult && (
            <Alert severity="success" sx={{ backgroundColor: '#0F1F18', border: '1px solid #10B981', color: '#10B981', '& .MuiAlert-icon': { color: '#10B981' } }}>
              {t('adminSettings.seederResult', { seeded: seedResult.locationsSeeded, events: seedResult.eventsCreated, updated: seedResult.eventsUpdated })}
            </Alert>
          )}
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          <Paper sx={{ p: 3, backgroundColor: '#1A1A2E', border: '1px solid #2D2D44' }}>
            <Typography variant="h6" sx={{ mb: 1, color: '#fff' }}>
              {t('adminSettings.jobsTitle')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#8E8E8E' }}>
              {t('adminSettings.jobsDesc')}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                {
                  id: 'check-expired-locations',
                  label: t('adminSettings.jobExpiredLocations'),
                  desc: t('adminSettings.jobExpiredLocationsDesc'),
                  fn: triggerCheckExpiredLocations,
                  color: '#EF4444',
                },
                {
                  id: 'check-expired-events',
                  label: t('adminSettings.jobExpiredEvents'),
                  desc: t('adminSettings.jobExpiredEventsDesc'),
                  fn: triggerCheckExpiredEvents,
                  color: '#F59E0B',
                },
                {
                  id: 'extend-duration-by-likes',
                  label: t('adminSettings.jobExtendDuration'),
                  desc: t('adminSettings.jobExtendDurationDesc'),
                  fn: triggerExtendDurationByLikes,
                  color: '#10B981',
                },
                {
                  id: 'check-merge-duplicate-locations',
                  label: t('adminSettings.jobMergeDuplicates'),
                  desc: t('adminSettings.jobMergeDuplicatesDesc'),
                  fn: triggerCheckMergeDuplicates,
                  color: '#3B82F6',
                },
                {
                  id: 'analyze-and-cluster-events',
                  label: t('adminSettings.jobAnalyzeEvents'),
                  desc: t('adminSettings.jobAnalyzeEventsDesc'),
                  fn: triggerAnalyzeAndClusterEvents,
                  color: '#A855F7',
                },
              ].map(({ id, label, desc, fn, color }) => (
                <Box
                  key={id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#0F0F1A',
                    border: '1px solid #2D2D44',
                    borderRadius: 2,
                    px: 2,
                    py: 1.5,
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                      {label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8E8E8E' }}>
                      {desc}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={jobLoading === id}
                    onClick={() => handleTriggerJob(id, fn)}
                    startIcon={jobLoading === id ? <CircularProgress size={14} /> : null}
                    sx={{
                      borderColor: color,
                      color: color,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      '&:hover': { borderColor: color, backgroundColor: color + '22' },
                      '&.Mui-disabled': { borderColor: '#2D2D44', color: '#8E8E8E' },
                    }}
                  >
                    {jobLoading === id ? t('adminSettings.jobRunning') : t('adminSettings.run')}
                  </Button>
                </Box>
              ))}
            </Box>

            {jobMessage && (
              <Alert
                severity={jobMessage.startsWith('✓') ? 'success' : 'error'}
                sx={{
                  mt: 2,
                  backgroundColor: jobMessage.startsWith('✓') ? '#0F1F18' : '#4D1B1B',
                  border: `1px solid ${jobMessage.startsWith('✓') ? '#10B981' : '#FF6B6B'}`,
                  color: jobMessage.startsWith('✓') ? '#10B981' : '#FF6B6B',
                  '& .MuiAlert-icon': { color: jobMessage.startsWith('✓') ? '#10B981' : '#FF6B6B' },
                }}
              >
                {jobMessage}
              </Alert>
            )}
          </Paper>
        </Box>
      )}
    </div>
  );
};

export default AdminSettingsPage;
