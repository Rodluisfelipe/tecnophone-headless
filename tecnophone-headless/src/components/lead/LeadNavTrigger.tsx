'use client';

import { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import { useLeadStore } from '@/store/lead';

interface LeadNavTriggerProps {
  variant?: 'mobile' | 'desktop';
}

export default function LeadNavTrigger({ variant = 'desktop' }: LeadNavTriggerProps) {
  const lead = useLeadStore((s) => s.lead);
  const openModal = useLeadStore((s) => s.openModal);

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useLeadStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  if (!hydrated || lead) return null;

  if (variant === 'mobile') {
    return (
      <button
        onClick={() => openModal('nav-mobile')}
        aria-label="Activa tu envío gratis"
        className="flex-shrink-0 inline-flex items-center gap-1 px-2 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold transition-colors"
      >
        <Gift className="w-3.5 h-3.5" strokeWidth={2.4} />
        <span>Envío GRATIS</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => openModal('nav-desktop')}
      aria-label="Activa tu Envío GRATIS"
      title="Gana Envío GRATIS"
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all"
    >
      <Gift className="w-4 h-4" strokeWidth={2.4} />
      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" aria-hidden="true" />
    </button>
  );
}
