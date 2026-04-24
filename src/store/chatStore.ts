import { create } from 'zustand';
import type { ChatMessage, Generation } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  currentSessionId: string | null;
  isTyping: boolean;
  generations: Generation[];
  activeGeneration: Generation | null;

  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setTyping: (typing: boolean) => void;
  setSessionId: (sessionId: string | null) => void;
  setGenerations: (generations: Generation[]) => void;
  addGeneration: (generation: Generation) => void;
  updateGeneration: (id: string, updates: Partial<Generation>) => void;
  setActiveGeneration: (generation: Generation | null) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentSessionId: null,
  isTyping: false,
  generations: [],
  activeGeneration: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages) => set({ messages }),

  setTyping: (isTyping) => set({ isTyping }),

  setSessionId: (sessionId) => set({ currentSessionId: sessionId }),

  setGenerations: (generations) => set({ generations }),

  addGeneration: (generation) =>
    set((state) => ({
      generations: [generation, ...state.generations],
    })),

  updateGeneration: (id, updates) =>
    set((state) => ({
      generations: state.generations.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
      activeGeneration:
        state.activeGeneration?.id === id
          ? { ...state.activeGeneration, ...updates }
          : state.activeGeneration,
    })),

  setActiveGeneration: (generation) => set({ activeGeneration: generation }),

  clearChat: () =>
    set({
      messages: [],
      currentSessionId: null,
    }),
}));
