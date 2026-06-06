import type { PracticeSession } from '../types';
import { get } from './client';

export function fetchReport(id: number): Promise<PracticeSession> {
  return get<PracticeSession>(`/reports/${id}`);
}
