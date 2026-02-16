import { useEffect, useState } from 'react';
import { fetchAIStatistics, AIStatistics } from '../core/api/AIApiService';
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
        setError('Failed to load statistics');
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
        <div className="statistics-loading">Loading statistics...</div>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="statistics-page">
        <div className="statistics-error">{error || 'No data available'}</div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  // Prepare data for classification chart
  const classificationData = [
    { name: 'Embedding Verifier', value: statistics.classification.huggingFaceSuccess },
    { name: 'GPT Verifier', value: statistics.classification.openAISuccess },
    { name: 'Keyword Fallback', value: statistics.classification.keywordFallback },
  ];

  // Prepare data for matching chart
  const matchingData = [
    { name: 'GPT Matcher', value: statistics.matching.gptSuccess },
    { name: 'Embedding Matcher', value: statistics.matching.embeddingSuccess },
    { name: 'Keyword Fallback', value: statistics.matching.keywordFallback },
  ];

  // Prepare comparison data
  const comparisonData = [
    {
      category: 'Classification',
      total: statistics.classification.totalCalls,
    },
    {
      category: 'Matching',
      total: statistics.matching.totalCalls,
    },
    {
      category: 'Translation',
      total: statistics.translation.translationsPerformed,
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="statistics-page">
      <header className="statistics-header">
        <h1 className="statistics-title">AI Statistics Dashboard</h1>
        <p className="statistics-subtitle">
          Last updated: {formatDate(statistics.lastUpdated)}
        </p>
      </header>

      <div className="statistics-grid">
        {/* Classification Statistics */}
        <div className="statistics-card">
          <h2 className="card-title">Classification Methods</h2>
          <div className="card-stat">
            <span className="stat-label">Total Calls:</span>
            <span className="stat-value">{statistics.classification.totalCalls}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={classificationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {classificationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="card-details">
            <div className="detail-row">
              <span style={{ color: COLORS[0] }}>●</span>
              <span>Embedding Matcher: {statistics.classification.huggingFaceSuccess}</span>
            </div>
            <div className="detail-row">
              <span style={{ color: COLORS[1] }}>●</span>
              <span>GPT Verifier: {statistics.classification.openAISuccess}</span>
            </div>
            <div className="detail-row">
              <span style={{ color: COLORS[2] }}>●</span>
              <span>Keyword Fallback: {statistics.classification.keywordFallback}</span>
            </div>
          </div>
        </div>

        {/* Matching Statistics */}
        <div className="statistics-card">
          <h2 className="card-title">Matching Methods</h2>
          <div className="card-stat">
            <span className="stat-label">Total Calls:</span>
            <span className="stat-value">{statistics.matching.totalCalls}</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={matchingData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {matchingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="card-details">
            <div className="detail-row">
              <span style={{ color: COLORS[0] }}>●</span>
              <span>GPT: {statistics.matching.gptSuccess}</span>
            </div>
            <div className="detail-row">
              <span style={{ color: COLORS[1] }}>●</span>
              <span>Embedding: {statistics.matching.embeddingSuccess}</span>
            </div>
            <div className="detail-row">
              <span style={{ color: COLORS[2] }}>●</span>
              <span>Keyword Fallback: {statistics.matching.keywordFallback}</span>
            </div>
          </div>
        </div>

        {/* Overall Comparison */}
        <div className="statistics-card wide">
          <h2 className="card-title">Overall Activity Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#3b82f6" name="Total Calls" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
