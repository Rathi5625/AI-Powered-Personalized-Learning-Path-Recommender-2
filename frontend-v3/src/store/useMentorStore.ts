import { create } from 'zustand';
import type { MentorContextType } from '@/types';

export interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  pending?: boolean;
}

interface MentorState {
  isMentorOpen: boolean;
  contextType: MentorContextType;
  contextId: string | null;
  contextTitle: string | null;
  messages: MentorMessage[];
  /**
   * Open the mentor panel bound to a context. Passing a new context resets the
   * conversation so the tutor is grounded on what the user is actually looking at.
   */
  openMentor: (opts?: {
    contextType?: MentorContextType;
    contextId?: string | number | null;
    contextTitle?: string | null;
  }) => void;
  closeMentor: () => void;
  toggleMentor: () => void;
  addMessage: (msg: MentorMessage) => void;
  updateMessage: (id: string, patch: Partial<MentorMessage>) => void;
  clearMessages: () => void;
}

export const useMentorStore = create<MentorState>((set) => ({
  isMentorOpen: false,
  contextType: 'GENERAL',
  contextId: null,
  contextTitle: null,
  messages: [],
  openMentor: (opts) =>
    set((state) => {
      const nextType = opts?.contextType ?? 'GENERAL';
      const nextId =
        opts?.contextId === undefined || opts?.contextId === null
          ? null
          : String(opts.contextId);
      const contextChanged =
        nextType !== state.contextType || nextId !== state.contextId;
      return {
        isMentorOpen: true,
        contextType: nextType,
        contextId: nextId,
        contextTitle: opts?.contextTitle ?? null,
        // Fresh context => fresh conversation.
        messages: contextChanged ? [] : state.messages,
      };
    }),
  closeMentor: () => set({ isMentorOpen: false }),
  toggleMentor: () => set((s) => ({ isMentorOpen: !s.isMentorOpen })),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  clearMessages: () => set({ messages: [] }),
}));
