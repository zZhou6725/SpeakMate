import type { HistoryEntry, HistoryFiltersType } from '../types';
import { get } from './client';

export function fetchHistory(params?: {
  scenario?: string;
  timeRange?: string;
}): Promise<HistoryEntry[]> {
  const searchParams = new URLSearchParams();
  if (params?.scenario) searchParams.set('scenario', params.scenario);
  if (params?.timeRange) searchParams.set('timeRange', params.timeRange);
  const qs = searchParams.toString();
  return get<HistoryEntry[]>(`/history${qs ? '?' + qs : ''}`);
}

export function fetchHistoryFilters(): Promise<HistoryFiltersType> {
  return get<HistoryFiltersType>('/history/filters');
}
