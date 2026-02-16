import {BASE_API_URL} from "../../core/index";

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
  lastUpdated: string;
}

export const fetchAIStatistics = async (): Promise<AIStatistics> => {
  const response = await fetch(`${BASE_API_URL}/AI/statistics`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch AI statistics');
  }
  
  return await response.json();
};
