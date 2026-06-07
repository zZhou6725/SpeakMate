import type { PronunciationResult } from '../types';
import { post } from './client';

export function fetchPronunciation(text: string): Promise<PronunciationResult> {
  return post<PronunciationResult>('/pronunciation', { text });
}