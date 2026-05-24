import type {
  AnalyticsDashboard,
  AnalyticsIntentStat,
  AnalyticsOverview,
  AnalyticsPerformance,
  AnalyticsSourceStat,
  AnalyticsTrendPoint,
} from '../types/analytics';
import { request } from '../utils/request';

function buildDaysQuery(days: number) {
  return `?days=${days}`;
}

export function getAnalyticsDashboard(days: number) {
  return request<AnalyticsDashboard>(`/api/analytics/dashboard${buildDaysQuery(days)}`);
}

export function getAnalyticsOverview(days: number) {
  return request<AnalyticsOverview>(`/api/analytics/overview${buildDaysQuery(days)}`);
}

export function getAnalyticsTrends(days: number) {
  return request<AnalyticsTrendPoint[]>(`/api/analytics/trends${buildDaysQuery(days)}`);
}

export function getAnalyticsIntents(days: number) {
  return request<AnalyticsIntentStat[]>(`/api/analytics/intents${buildDaysQuery(days)}`);
}

export function getAnalyticsSources(days: number) {
  return request<AnalyticsSourceStat[]>(`/api/analytics/sources${buildDaysQuery(days)}`);
}

export function getAnalyticsPerformance(days: number) {
  return request<AnalyticsPerformance>(`/api/analytics/performance${buildDaysQuery(days)}`);
}
