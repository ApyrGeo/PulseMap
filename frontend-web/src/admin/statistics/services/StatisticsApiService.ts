import { BASE_API_URL } from '../../../core/index';
import { TokenService } from '../../../auth/TokenService';

export interface AIStatistics {
  classification: {
    huggingFaceSuccess: number;
    openAISuccess: number;
    keywordFallback: number;
    totalCalls: number;
  };
  matching: {
    gptSuccess: number;
    embeddingSuccess: number;
    keywordFallback: number;
    totalCalls: number;
  };
  translation: {
    translationsPerformed: number;
  };
  events: {
    gptEventExtractorSuccess: number;
    embeddingEventExtractorSuccess: number;
    eventClusteringRuns: number;
  };
  recommendations: {
    requestsTotal: number;
    aiScoringSuccess: number;
    fallbackCalls: number;
  };
  lastUpdated: string;
}

export const fetchAIStatistics = async (): Promise<AIStatistics> => {
  const response = await fetch(`${BASE_API_URL}/AI/statistics`, {
    headers: { ...TokenService.getAuthHeader() },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch AI statistics');
  }

  return await response.json();
};
