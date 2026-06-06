import type { Scenario } from '../types';
import { get } from './client';

export function fetchScenarios(): Promise<Scenario[]> {
  return get<Scenario[]>('/scenarios');
}
