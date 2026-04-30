import { FormEvent, useEffect, useState } from 'react';
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
} from '@mui/material';

const AdminSettingsPage = () => {
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
      setJobMessage(`✓ Job "${jobId}" enqueued — se va executa în câteva secunde.`);
    } catch {
      setJobMessage(`✗ Eroare la pornirea job-ului "${jobId}".`);
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
      setSeederError('Seeder-ul a eșuat. Încearcați din nou.');
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
      alert('Failed to add category. Please try again.');
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

  const sectionStyle: React.CSSProperties = {
    border: '1px solid #2D2D44',
    borderRadius: 10,
    padding: 16,
    backgroundColor: '#1A1A2E',
    marginBottom: 16,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: '1px solid #2D2D44',
    borderRadius: 8,
    padding: '10px 12px',
    backgroundColor: '#0F0F1A',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
  };

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '8px 6px',
    color: '#8E8E8E',
    fontSize: '0.8rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 6px',
    borderTop: '1px solid #2D2D44',
    color: '#fff',
    fontSize: '0.875rem',
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16, color: '#fff' }}>
        Settings
      </h1>

      <Box sx={{ borderBottom: 1, borderColor: '#2D2D44', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v: number) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': { color: '#8E8E8E', textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { color: '#FF6B35 !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#FF6B35' },
          }}
        >
          <Tab label="Categorii" />
          <Tab label="Deduplicare" />
          <Tab label="Seeder" />
          <Tab label="Jobs" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <>
          <section style={sectionStyle}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12, color: '#fff' }}>
              Categories
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="New category name"
                required
                style={inputStyle}
              />
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 18px',
                  backgroundColor: '#FF6B35',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                {isSaving ? 'Adding...' : 'Add Category'}
              </button>
            </form>
          </section>

          <section style={{ ...sectionStyle, marginBottom: 0 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12, color: '#fff' }}>
              Existing Categories
            </h2>
            {isLoading ? (
              <p style={{ margin: 0, color: '#8E8E8E' }}>Loading categories...</p>
            ) : categories.length === 0 ? (
              <p style={{ margin: 0, color: '#8E8E8E' }}>No categories found.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Slug</th>
                      <th style={thStyle}>Active</th>
                      <th style={thStyle}>Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td style={tdStyle}>{category.name}</td>
                        <td style={tdStyle}>{category.slug}</td>
                        <td style={tdStyle}>
                          <span style={{
                            color: category.isActive ? '#10B981' : '#8E8E8E',
                            fontWeight: 600,
                          }}>
                            {category.isActive ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td style={tdStyle}>{category.sortOrder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {activeTab === 1 && (
        <Box>
          <EventDetectionPanel />

          <Paper sx={{ p: 3, mb: 3, mt: 3, backgroundColor: '#1A1A2E', border: '1px solid #2D2D44' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
              Check and Merge Duplicates
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Max Distance (meters)"
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
                  '&:hover': { backgroundColor: '#2563eb' },
                  '&.Mui-disabled': { backgroundColor: '#2D2D44', color: '#8E8E8E' },
                }}
              >
                {mergeLoading ? 'Checking...' : 'Check & Merge Duplicates'}
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
                Results
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
                  No results to display.
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
              Seeder Locații Starred
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: '#8E8E8E' }}>
              Recreează locațiile marcate cu ★ și redetectează event-urile.
            </Typography>

            {starredLocations.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2, backgroundColor: '#0F1F18', border: '1px solid #10B981', color: '#10B981', '& .MuiAlert-icon': { color: '#10B981' } }}>
                Nicio locație starred. Marchează locații expirate de pe hartă folosind butonul ★.
              </Alert>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, color: '#B0B0B0' }}>
                  {starredLocations.length} locație(i) starred:
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
              {seederLoading ? 'Se rulează...' : 'Run Seeder'}
            </Button>
          </Paper>

          {seederError && (
            <Alert severity="error" sx={{ mb: 2, backgroundColor: '#4D1B1B', border: '1px solid #FF6B6B', color: '#FF6B6B', '& .MuiAlert-icon': { color: '#FF6B6B' } }}>
              {seederError}
            </Alert>
          )}

          {seedResult && (
            <Alert severity="success" sx={{ backgroundColor: '#0F1F18', border: '1px solid #10B981', color: '#10B981', '& .MuiAlert-icon': { color: '#10B981' } }}>
              {seedResult.locationsSeeded} locații extinse · {seedResult.eventsCreated} events noi · {seedResult.eventsUpdated} events reactivate
            </Alert>
          )}
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          <Paper sx={{ p: 3, backgroundColor: '#1A1A2E', border: '1px solid #2D2D44' }}>
            <Typography variant="h6" sx={{ mb: 1, color: '#fff' }}>
              Rulare manuală Hangfire Jobs
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#8E8E8E' }}>
              Fiecare job este adăugat în coada Hangfire și se execută imediat.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                {
                  id: 'check-expired-locations',
                  label: 'Check Expired Locations',
                  desc: 'Marchează ca expirate locațiile cu ExpiresAt în trecut.',
                  fn: triggerCheckExpiredLocations,
                  color: '#EF4444',
                },
                {
                  id: 'check-expired-events',
                  label: 'Check Expired Events',
                  desc: 'Expiră event-urile fără locații active.',
                  fn: triggerCheckExpiredEvents,
                  color: '#F59E0B',
                },
                {
                  id: 'extend-duration-by-likes',
                  label: 'Extend Duration by Likes',
                  desc: 'Recalculează durata locațiilor pe baza like-urilor și rapoartelor.',
                  fn: triggerExtendDurationByLikes,
                  color: '#10B981',
                },
                {
                  id: 'check-merge-duplicate-locations',
                  label: 'Check & Merge Duplicates',
                  desc: 'Detectează și merge-uiește locațiile duplicate.',
                  fn: triggerCheckMergeDuplicates,
                  color: '#3B82F6',
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
                    {jobLoading === id ? 'Se trimite...' : 'Run'}
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
