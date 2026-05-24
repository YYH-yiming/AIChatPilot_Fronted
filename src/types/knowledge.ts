export type KnowledgeBaseStatus = number;
export type KnowledgeDocumentParseStatus = 0 | 1 | 2 | 3;

export type KnowledgeBase = {
  id: number;
  tenantId: number;
  name: string;
  description?: string;
  docCount: number;
  chunkCount: number;
  embeddingModel?: string;
  status: KnowledgeBaseStatus;
  createdAt?: string;
};

export type KnowledgeBasePayload = {
  name: string;
  description?: string;
  embeddingModel?: string;
};

export type KnowledgeDocument = {
  docId: number;
  kbId: number;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
  parseStatus: KnowledgeDocumentParseStatus;
  chunkCount: number;
  errorMsg?: string;
  message?: string;
  createdAt?: string;
};

export type KnowledgeChunk = {
  id: number;
  docId: number;
  kbId: number;
  chunkIndex: number;
  content: string;
  tokenCount?: number;
  metadata?: string;
  createdAt?: string;
};

export type KnowledgeSearchPayload = {
  query: string;
  topK?: number;
};

export type KnowledgeSearchResult = {
  chunkId: number;
  docId: number;
  kbId: number;
  chunkIndex: number;
  tokenCount?: number;
  content: string;
  score?: number;
  denseScore?: number | null;
  sparseScore?: number | null;
  source?: string;
};

export type KnowledgeAskResponse = {
  kbId: number;
  query: string;
  topK: number;
  answer: string;
  grounded: boolean;
  referenceCount: number;
  model?: string;
  references: KnowledgeSearchResult[];
};
