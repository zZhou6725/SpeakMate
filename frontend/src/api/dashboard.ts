import type { DashboardStats } from '../types';
import { get } from './client';

export function fetchDashboardStats(): Promise<DashboardStats> {
  return get<DashboardStats>('/dashboard/stats');
}
