'use client';

import { create } from 'zustand';

interface ChatStore {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  isOpen: false,
  openChat: () => set({ isOpen: true }),
  closeChat: () => set({ isOpen: false }),
  toggleChat: () => set((s) => ({ isOpen: !s.isOpen })),
}));
