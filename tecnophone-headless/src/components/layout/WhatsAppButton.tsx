'use client';

import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/573132294533?text=Hola%2C%20necesito%20ayuda"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-[88px] lg:bottom-6 right-4 lg:right-6 z-40 group flex items-center gap-2.5 bg-white/90 backdrop-blur-xl border border-surface-200 text-gray-900 pl-4 pr-5 py-3 rounded-2xl shadow-2xl shadow-gray-200/60 hover:bg-surface-50 hover:border-surface-300 hover:-translate-y-0.5 transition-all duration-300"
      aria-label="Contactar por WhatsApp"
    >
      <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
        <MessageCircle className="w-5 h-5 text-white" />
      </div>
      <span className="hidden md:block text-sm font-semibold">Asesor técnico</span>
    </a>
  );
}
