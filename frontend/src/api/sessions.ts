import type { PracticeSession, ChatMessage, FeedbackData } from '../types';
import { post } from './client';

interface MessageOut {
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
  feedback: FeedbackData;
}

export function createSession(scenarioId: number): Promise<PracticeSession> {
  return post<PracticeSession>('/sessions', { scenarioId });
}

export function sendMessage(sessionId: number, message: string): Promise<MessageOut> {
  return post<MessageOut>(`/sessions/${sessionId}/messages`, { message });
}

export function endSession(sessionId: number): Promise<PracticeSession> {
  return post<PracticeSession>(`/sessions/${sessionId}/end`, {});
}
