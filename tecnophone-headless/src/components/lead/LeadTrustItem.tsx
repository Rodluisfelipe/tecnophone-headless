'use client';

import { useEffect, useState } from 'react';
import { Gift } from 'lucide-react';
import { useLeadStore } from '@/store/lead';

export default function LeadTrustItem() {
  const lead = useLeadStore((s) => s.lead);
  const openModal = useLeadStore((s) => s.openModal);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useLeadStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  if (!hydrated || lead) {
    // Mantenemos el espacio para no romper el grid (placeholder)
    return (
      <div className="flex items-center justify-center gap-3 py-5">
        <Gift className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <span className="text-gray-700 text-sm font-semibold">Envío GRATIS incluido</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => openModal('trust-strip')}
      className="flex items-center justify-center gap-3 py-5 text-emerald-700 hover:bg-emerald-50 transition-colors group cursor-pointer"
    >
      <Gift className="w-5 h-5 text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-bold">
        Gana Envío GRATIS <span className="text-emerald-600 underline">click aquí</span>
      </span>
    </button>
  );
}
