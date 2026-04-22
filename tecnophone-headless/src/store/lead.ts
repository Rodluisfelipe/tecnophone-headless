'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CapturedLead {
  name: string;
  phone: string;
  company?: string;
  capturedAt: number;
  source: string;
}

interface LeadStore {
  lead: CapturedLead | null;
  dismissedAt: number | null;
  isModalOpen: boolean;
  triggerSource: string | null;
  setLead: (lead: CapturedLead) => void;
  dismiss: () => void;
  openModal: (source: string) => void;
  closeModal: () => void;
  shouldShow: () => boolean;
}

const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

export const useLeadStore = create<LeadStore>()(
  persist(
    (set, get) => ({
      lead: null,
      dismissedAt: null,
      isModalOpen: false,
      triggerSource: null,

      setLead: (lead) =>
        set({ lead, isModalOpen: false, triggerSource: null }),

      dismiss: () =>
        set({ dismissedAt: Date.now(), isModalOpen: false, triggerSource: null }),

      openModal: (source) => {
        // Si ya hay lead capturado, no reabrimos
        if (get().lead) return;
        set({ isModalOpen: true, triggerSource: source });
      },

      closeModal: () =>
        set({ isModalOpen: false, triggerSource: null }),

      shouldShow: () => {
        const { lead, dismissedAt } = get();
        if (lead) return false;
        if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) return false;
        return true;
      },
    }),
    {
      name: 'tp-lead',
      partialize: (state) => ({ lead: state.lead, dismissedAt: state.dismissedAt }),
      skipHydration: true,
    }
  )
);
