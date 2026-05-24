export type AnalyticsOverview = {
  days: number;
  startDate?: string;
  endDate?: string;
  totalSessions?: number;
  totalMessages?: number;
  userMessages?: number;
  assistantMessages?: number;
  uniqueUsers?: number;
  knowledgeAnswers?: number;
  agentAnswers?: number;
  agentCalls?: number;
  agentSuccessCalls?: number;
  agentFailedCalls?: number;
  totalTokens?: number;
  avgDurationMs?: number;
};

export type AnalyticsTrendPoint = {
  statDate: string;
  sessionsCreated?: number;
  sessionsClosed?: number;
  messagesTotal?: number;
  knowledgeAnswers?: number;
  agentAnswers?: number;
  totalTokens?: number;
};

export type AnalyticsIntentStat = {
  intent: string;
  hitCount: number;
};

export type AnalyticsSourceStat = {
  source: string;
  hitCount: number;
};

export type AnalyticsPerformance = {
  totalTokens?: number;
  avgTokensPerAnswer?: number;
  avgDurationMs?: number;
  avgReferencesPerAnswer?: number;
  groundedAnswers?: number;
  escalationCount?: number;
  agentSuccessRate?: number;
};

export type AnalyticsDashboard = {
  overview?: AnalyticsOverview;
  performance?: AnalyticsPerformance;
  trends?: AnalyticsTrendPoint[];
  intents?: AnalyticsIntentStat[];
  sources?: AnalyticsSourceStat[];
};
