import type { SearchFilters } from './mockSearch';

export type GeminiStatus = {
  mode: 'gemini' | 'mock';
  configured: boolean;
  storeName?: string;
  model: string;
  message: string;
};

export type GeminiCitation = {
  title?: string;
  text?: string;
  uri?: string;
  mediaId?: string;
  localPath?: string;
  kind?: string;
  pageNumber?: number;
  fileSearchStore?: string;
  customMetadata?: Array<{
    key?: string;
    stringValue?: string;
    numericValue?: number;
  }>;
};

export type GeminiQueryResponse = {
  mode: 'gemini' | 'mock';
  answer: string;
  citations: GeminiCitation[];
  rawGroundingMetadata?: unknown;
  model?: string;
  storeName?: string;
};

export type GeminiQueryRequest = {
  query: string;
  filters: SearchFilters;
};
