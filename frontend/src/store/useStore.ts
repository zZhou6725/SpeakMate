import { create } from 'zustand';
import type {
  Scenario,
  ChatMessage,
  FeedbackData,
  RadarData,
  DashboardStats,
  HistoryEntry,
  HistoryFiltersType,
  PracticeSession,
} from '../types';
import { fetchScenarios } from '../api/scenarios';
import { fetchDashboardStats } from '../api/dashboard';
import { fetchHistory, fetchHistoryFilters } from '../api/history';
import { createSession, sendMessage, endSession } from '../api/sessions';

interface AppState {
  // Scenarios
  scenarios: Scenario[];
  scenariosLoading: boolean;
  scenariosError: string | null;
  loadScenarios: () => Promise<void>;
  selectedScenarioId: number | null;
  selectScenario: (id: number) => void;

  // Dashboard stats
  dashboardStats: DashboardStats;
  dashboardLoading: boolean;
  dashboardError: string | null;
  loadDashboardStats: () => Promise<void>;

  // History
  history: HistoryEntry[];
  historyFilters: HistoryFiltersType;
  historyLoading: boolean;
  historyError: string | null;
  loadHistory: (params?: { scenario?: string; timeRange?: string }) => Promise<void>;
  loadHistoryFilters: () => Promise<void>;

  // Practice session
  conversation: ChatMessage[];
  isSessionActive: boolean;
  feedback: FeedbackData;
  radarData: RadarData;
  sessionScore: number;
  currentSessionId: number | null;
  lastReport: PracticeSession | null;

  startSession: () => Promise<void>;
  sendMessageAction: (text: string) => Promise<void>;
  endSessionAction: () => Promise<void>;
  addMessage: (msg: ChatMessage) => void;

  // UI
  loading: boolean;
  setLoading: (v: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  scenarios: [],
  scenariosLoading: false,
  scenariosError: null,
  loadScenarios: async () => {
    set({ scenariosLoading: true, scenariosError: null });
    try {
      const data = await fetchScenarios();
      set({ scenarios: data, scenariosLoading: false });
    } catch (e) {
      set({ scenariosError: String(e), scenariosLoading: false });
    }
  },

  selectedScenarioId: null,
  selectScenario: (id) => set({ selectedScenarioId: id }),

  dashboardStats: { totalPractice: 0, averageScore: 0, bestScore: 0 },
  dashboardLoading: false,
  dashboardError: null,
  loadDashboardStats: async () => {
    set({ dashboardLoading: true, dashboardError: null });
    try {
      const data = await fetchDashboardStats();
      set({ dashboardStats: data, dashboardLoading: false });
    } catch (e) {
      set({ dashboardError: String(e), dashboardLoading: false });
    }
  },

  history: [],
  historyFilters: { scenarios: ['全部'], timeRanges: ['本周', '本月', '全部'] },
  historyLoading: false,
  historyError: null,
  loadHistory: async (params) => {
    set({ historyLoading: true, historyError: null });
    try {
      const data = await fetchHistory(params);
      set({ history: data, historyLoading: false });
    } catch (e) {
      set({ historyError: String(e), historyLoading: false });
    }
  },
  loadHistoryFilters: async () => {
    try {
      const data = await fetchHistoryFilters();
      set({ historyFilters: data });
    } catch {
      // keep defaults
    }
  },

  conversation: [],
  isSessionActive: false,
  feedback: { grammar: 0, pronunciation: 0, fluency: 0 },
  radarData: { pronunciation: 0, grammar: 0, vocabulary: 0, fluency: 0, confidence: 0 },
  sessionScore: 0,
  currentSessionId: null,
  lastReport: null,

  startSession: async () => {
    const { selectedScenarioId } = get();
    if (!selectedScenarioId) return;
    const session = await createSession(selectedScenarioId);
    set({
      isSessionActive: true,
      currentSessionId: session.id,
      conversation: session.conversation,
      feedback: session.feedback,
      radarData: session.radarData,
      sessionScore: session.score,
    });
  },

  sendMessageAction: async (text: string) => {
    const { currentSessionId, conversation } = get();
    if (!currentSessionId) return;
    const result = await sendMessage(currentSessionId, text);
    set({
      conversation: [...conversation, result.userMessage, result.aiMessage],
      feedback: result.feedback,
    });
  },

  endSessionAction: async () => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;
    const report = await endSession(currentSessionId);
    set({
      isSessionActive: false,
      lastReport: report,
      conversation: report.conversation,
      feedback: report.feedback,
      radarData: report.radarData,
      sessionScore: report.score,
    });
  },

  addMessage: (msg) => {
    set((s) => ({ conversation: [...s.conversation, msg] }));
  },

  loading: false,
  setLoading: (v) => set({ loading: v }),
}));
