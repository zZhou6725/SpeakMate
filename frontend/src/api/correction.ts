import type { GrammarCorrection } from '../types';
import { post } from './client';

export function fetchCorrection(text: string): Promise<GrammarCorrection> {
  return post<GrammarCorrection>('/correction', { text });
}