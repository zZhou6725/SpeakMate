import { create } from 'zustand';
import type { Scenario, ChatMessage, FeedbackData, RadarData } from '../types';
import {
  scenarios as mockScenarios,
  conversation as mockConversation,
  feedback as mockFeedback,
  radarData as mockRadarData,
  getConversationByScenario,
} from '../mock/mock_data';

interface AppState {
  // Scenarios
  scenarios: Scenario[];
  selectedScenarioId: number | null;
  selectScenario: (id: number) => void;

  // Practice session
  conversation: ChatMessage[];
  isSessionActive: boolean;
  feedback: FeedbackData;
  radarData: RadarData;
  sessionScore: number;

  startSession: () => void;
  endSession: () => void;
  addMessage: (msg: ChatMessage) => void;

  // Simulated loading for placeholder animations
  loading: boolean;
  setLoading: (v: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  scenarios: mockScenarios,
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