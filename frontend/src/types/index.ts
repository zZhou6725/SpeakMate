export interface Scenario {
  id: number;
  name: string;
  difficulty: '简单' | '中等' | '困难';
}

export interface ChatMessage {
  role: 'ai' | 'user';
  message: string;
}

export interface FeedbackData {
  grammar: number;
  pronunciation: number;
  fluency: number;
}

export interface RadarData {
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  fluency: number;
  confidence: number;
}

export interface DashboardStats {
  totalPractice: number;
  averageScore: number;
  bestScore: number;
}

export interface HistoryEntry {
  id: number;
  date: string;
  scenario: string;
  score: number;
  duration: string;
  grammar: number;
  pronunciation: number;
}

export interface HistoryFiltersType {
  scenarios: string[];
  timeRanges: string[];
}

export interface CorrectionItem {
  wrong: string;
  correct: string;
  reason: string;
}

export interface GrammarCorrection {
  original: string;
  corrected: string;
  items: CorrectionItem[];
}

export interface PronunciationItem {
  word: string;
  phonetic: string;
  tip: string;
}

export interface PronunciationResult {
  text: string;
  score: number;
  items: PronunciationItem[];
}

export interface SessionSummary {
  overall: string;
  strengths: string[];
  improvements: string[];
  tips: string[];
}

export interface VocabularyStats {
  totalWords: number;
  uniqueWords: number;
  avgWordLength: number;
  accuracy: number;
}

export interface PracticeSession {
  id: number;
  scenarioId: number;
  scenarioName: string;
  difficulty: string;
  conversation: ChatMessage[];
  feedback: FeedbackData;
  radarData: RadarData;
  vocabulary: VocabularyStats | null;
  correction?: GrammarCorrection | null;
  pronunciation?: PronunciationResult | null;
  summary?: SessionSummary | null;
  score: number;
  duration: string;
}