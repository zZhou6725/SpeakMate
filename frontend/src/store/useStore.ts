import { create } from 'zustand';
import type { Scenario, ChatMessage, FeedbackData, RadarData } from '../types';
import {
  conversation as mockConversation,
  feedback as mockFeedback,
  radarData as mockRadarData,
  getConversationByScenario,
} from '../mock/mock_data';
import { fetchScenarios } from '../api/scenarios';

interface AppState {
  // Scenarios
  scenarios: Scenario[];
  scenariosLoading: boolean;
  scenariosError: string | null;
  loadScenarios: () => Promise<void>;
  selectedScenarioId: number | null;
  selectScenario: (id: number) => void;

  // Practice session (still mock for now, will be replaced in Section 4)
  conversation: ChatMessage[];
  isSessionActive: boolean;
  feedback: FeedbackData;
  radarData: RadarData;
  sessionScore: number;

  startSession: () => void;
  endSession: () => void;
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

  conversation: [],
  isSessionActive: false,
  feedback: { grammar: 0, pronunciation: 0, fluency: 0 },
  radarData: { pronunciation: 0, grammar: 0, vocabulary: 0, fluency: 0, confidence: 0 },
  sessionScore: 0,

  startSession: () => {
    const { selectedScenarioId } = get();
    const msgs = selectedScenarioId
      ? getConversationByScenario(selectedScenarioId)
      : mockConversation;
    set({
      isSessionActive: true,
      conversation: msgs,
      feedback: mockFeedback,
      radarData: mockRadarData,
      sessionScore: 85,
    });
  },

  endSession: () => {
    set({ isSessionActive: false });
  },

  addMessage: (msg) => {
    set((s) => ({ conversation: [...s.conversation, msg] }));
  },

  loading: false,
  setLoading: (v) => set({ loading: v }),
}));
