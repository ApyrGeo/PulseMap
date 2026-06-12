import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  fetchAIStatistics,
  AIStatistics,
} from './services/StatisticsApiService';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './StatisticsPage.css';

const StatisticsPage = () => {
  const { t } = useTranslation();
  const [statistics, setStatistics] = useState<AIStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true);
        const data = await fetchAIStatistics();
        setStatistics(data);
        setError(null);
      } catch (err) {
        setError(t('adminStats.error'));
        console.error('Error loading statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  if (loading) {
    return (
      <div className="statistics-page">
        <div className="statistics-loading">{t('adminStats.loading')}</div>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="statistics-page">
        <div className="statistics-error">{error || t('adminStats.noData')}</div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const classificationData = [
    {
      name: t('adminStats.seriesEmbeddingVerifier'),
      value: statistics.classification.huggingFaceSuccess,
    },
    { name: t('adminStats.seriesGptVerifier'), value: statistics.classification.openAISuccess },
    {
      name: t('adminStats.seriesKeywordFallback'),
      value: statistics.classification.keywordFallback,
    },
  ];

  const matchingData = [
    { name: t('adminStats.seriesEmbeddingMatcher'), value: statistics.matching.embeddingSuccess },
    { name: t('adminStats.seriesGptMatcher'), value: statistics.matching.gptSuccess },
    { name: t('adminStats.seriesKeywordFallback'), value: statistics.matching.keywordFallback },
  ];

  const eventsData = [
    {
      name: t('adminStats.seriesEmbeddingEventExtractor'),
      value: statistics.events.embeddingEventExtractorSuccess,
    },
    {
      name: t('adminStats.seriesGptEventExtractor'),
      value: statistics.events.gptEventExtractorSuccess,
    },
  ];

  const recommendationData = [
    { name: t('adminStats.recAiSuccess'), value: statistics.recommendations.aiScoringSuccess },
    { name: t('adminStats.recFallback'), value: statistics.recommendations.fallbackCalls },
  ];

  const comparisonData = [
    {
      category: t('adminStats.catClassification'),
      total: statistics.classification.totalCalls,
    },
    {
      category: t('adminStats.catMatching'),
      total: statistics.matching.totalCalls,
    },
    {
      category: t('adminStats.catTranslation'),
      total: statistics.translation.translationsPerformed,
    },
    {
      category: t('adminStats.catEventClustering'),
      total: statistics.events.eventClusteringRuns,
    },
  ];

  return (
    <div className="statistics-page">
      <div className="statistics-grid">
        {/* Classification Statistics */}
        <div className="statistics-card">
          <h2 className="card-title">{t('adminStats.classificationTitle')}</h2>
          <div className="card-stat">
            <span className="stat-label">{t('adminStats.totalCalls')}</span>
            <span className="stat-value">
              {statistics.classification.totalCalls}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={classificationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) =>
                  value > 0 ? `${name}: ${value}` : ''
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {classificationData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="card-details">
            <div className="detail-row">
              <span style={{ color: COLORS[0] }}>●</span>
              <span>{t('adminStats.seriesEmbeddingVerifier')}: {statistics.classification.huggingFaceSuccess}</span>
            </div>
            <div className="detail-row">
              <span style={{ color: COLORS[1] }}>●</span>
              <span>{t('adminStats.seriesGptVerifier')}: {statistics.classification.openAISuccess}</span>
            </div>
            <div className="detail-row">
              <span style={{ color: COLORS[2] }}>●</span>
              <span>{t('adminStats.seriesKeywordFallback')}: {statistics.classification.keywordFallback}</span>
            </div>
          </div>
        </div>

        {/* Matching Statistics */}
        <div className="statistics-card">
          <h2 className="card-title">{t('adminStats.matchingTitle')}</h2>
          <div className="card-stat">
            <span className="stat-label">{t('adminStats.totalCalls')}</span>
            <span className="stat-value">{statistics.matching.totalCalls}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={matchingData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) =>
                  value > 0 ? `${name}: ${value}` : ''
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {matchingData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="card-details">
            <div className="detail-row">
              <span style={{ color: COLORS[0] }}>●</span>
              <span>{t('adminStats.seriesEmbeddingMatcher')}: {statistics.matching.embeddingSuccess}</span>
            </div>
            <div className="detail-row">
              <span style={{ color: COLORS[1] }}>●</span>
              <span>{t('adminStats.seriesGptMatcher')}: {statistics.matching.gptSuccess}</span>
            </div>
            <div className="detail-row">
              <span style={{ color: COLORS[2] }}>●</span>
              <span>{t('adminStats.seriesKeywordFallback')}: {statistics.matching.keywordFallback}</span>
            </div>
          </div>
        </div>

        {/* Event Extraction Statistics */}
        <div className="statistics-card">
          <h2 className="card-title">{t('adminStats.eventExtractionTitle')}</h2>
          <div className="card-stat">
            <span className="stat-label">{t('adminStats.clusteringRuns')}</span>
            <span className="stat-value">
              {statistics.events.eventClusteringRuns}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) =>
                  value > 0 ? `${name}: ${value}` : ''
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {eventsData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="card-details">
            <div className="detail-row">
              <span style={{ color: COLORS[0] }}>●</span>
              <span>{t('adminStats.seriesEmbeddingEventExtractor')}: {statistics.events.embeddingEventExtractorSuccess}</span>
            </div>
            <div className="detail-row">
              <span style={{ color: COLORS[1] }}>●</span>
              <span>{t('adminStats.seriesGptEventExtractor')}: {statistics.events.gptEventExtractorSuccess}</span>
            </div>
          </div>
        </div>

        {/* Recommendation Engine Statistics */}
        <div className="statistics-card">
          <h2 className="card-title">{t('adminStats.recommendationTitle')}</h2>
          <div className="card-stat">
            <span className="stat-label">{t('adminStats.totalCalls')}</span>
            <span className="stat-value">{statistics.recommendations.requestsTotal}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={recommendationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {recommendationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="card-details">
            <div className="detail-row">
              <span style={{ color: COLORS[0] }}>●</span>
              <span>{t('adminStats.recAiSuccess')}: {statistics.recommendations.aiScoringSuccess}</span>
            </div>
            <div className="detail-row">
              <span style={{ color: COLORS[1] }}>●</span>
              <span>{t('adminStats.recFallback')}: {statistics.recommendations.fallbackCalls}</span>
            </div>
          </div>
        </div>

        {/* Overall Comparison */}
        <div className="statistics-card wide">
          <h2 className="card-title">{t('adminStats.overallActivity')}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#3b82f6" name={t('adminStats.totalCalls')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
