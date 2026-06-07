import type { PracticeSession, ChatMessage, FeedbackData, GrammarCorrection, PronunciationResult } from '../types';
import { post } from './client';

interface MessageOut {
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
  feedback: FeedbackData;
  correction?: GrammarCorrection | null;
  pronunciation?: PronunciationResult | null;
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

export async function sendMessageStream(
  sessionId: number,
  message: string,
  onToken: (token: string) => void,
  onDone: (result: MessageOut) => void,
): Promise<void> {
  const response = await fetch(`/api/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'token') {
            onToken(data.content);
          } else if (data.type === 'done') {
            onDone(data as MessageOut);
          }
        } catch {
          // skip incomplete or malformed data lines
        }
      }
    }
  }
}