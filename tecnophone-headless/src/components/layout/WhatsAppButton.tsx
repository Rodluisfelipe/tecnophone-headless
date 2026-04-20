'use client';

import { useEffect, useRef, useState } from 'react';

const WA_NUMBER = '573132294533';
const INACTIVITY_MS = 45_000;
const SESSION_KEY = 'wa_proactive_shown';

const MESSAGES = [
  { emoji: '👋', text: '¿Te ayudo a elegir?', sub: 'Un asesor está disponible ahora mismo.' },
  { emoji: '🤔', text: '¿Tienes dudas?', sub: 'Escríbenos y te respondemos en segundos.' },
  { emoji: '💬', text: '¿Buscas algo en especial?', sub: 'Cuéntanos y te conseguimos el mejor precio.' },
];

const WaSvg = () => (
  <svg viewBox="0 0 24 24" fill="white" className="w-[26px] h-[26px] relative z-10" aria-hidden="true">
    <path d="M20.472 3.506C18.202 1.234 15.17 0 11.974 0 5.42 0 .074 5.346.074 11.9c0 2.096.548 4.142 1.589 5.948L0 24l6.303-1.653a11.87 11.87 0 005.67 1.443h.005c6.549 0 11.895-5.347 11.895-11.901 0-3.18-1.239-6.166-3.401-8.383zm-8.498 18.3h-.004a9.86 9.86 0 01-5.022-1.372l-.36-.214-3.735.979 1-3.638-.234-.373a9.832 9.832 0 01-1.509-5.288c0-5.43 4.42-9.85 9.858-9.85 2.633 0 5.107 1.027 6.969 2.891a9.8 9.8 0 012.889 6.96c-.005 5.434-4.42 9.905-9.852 9.905zm5.405-7.387c-.296-.148-1.755-.866-2.027-.965-.273-.099-.47-.148-.668.149-.197.297-.765.964-.938 1.163-.173.198-.346.222-.642.074-.297-.148-1.252-.461-2.385-1.473-.882-.787-1.476-1.759-1.649-2.055-.173-.297-.018-.457.13-.605.134-.132.296-.346.445-.519.148-.174.197-.297.296-.495.099-.198.05-.371-.025-.52-.074-.148-.668-1.61-.915-2.204-.24-.578-.485-.5-.668-.51-.173-.006-.37-.007-.568-.007-.198 0-.52.074-.791.371-.272.297-1.037 1.015-1.037 2.474 0 1.46 1.062 2.87 1.21 3.068.148.198 2.09 3.19 5.064 4.475.708.306 1.259.489 1.69.625.71.226 1.357.194 1.868.118.569-.084 1.754-.717 2.001-1.41.247-.692.247-1.285.172-1.41-.074-.124-.272-.197-.568-.346z" />
  </svg>
);

export default function WhatsAppButton() {
  const [popup, setPopup] = useState(false);
  const [visible, setVisible] = useState(false); // controls CSS transition
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pick a random message (stable per session)
  const msgRef = useRef(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);

  const showPopup = () => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) return;
    setPopup(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    sessionStorage.setItem(SESSION_KEY, '1');
    // Auto-dismiss after 12 seconds
    dismissTimerRef.current = setTimeout(dismiss, 12_000);
  };

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => setPopup(false), 300);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(showPopup, INACTIVITY_MS);
  };

  useEffect(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) return;
    const events = ['mousemove', 'scroll', 'keydown', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola TecnoPhone, me gustaría recibir asesoría')}`;
  const msg = msgRef.current;

  return (
    <div className="fixed z-40 right-4 bottom-20 lg:right-6 lg:bottom-[96px] flex flex-col items-end gap-2 wa-enter">

      {/* ── Proactive popup bubble ── */}
      {popup && (
        <div
          className={[
            'relative bg-white rounded-2xl shadow-2xl border border-gray-100',
            'p-4 w-64 transition-all duration-300',
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
          ].join(' ')}
          role="dialog"
          aria-live="polite"
        >
          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Cerrar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Avatar row */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0 shadow">
              <WaSvg />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-900 leading-none">TecnoPhone</p>
              <span className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-600 font-semibold">En línea ahora</span>
              </span>
            </div>
          </div>

          {/* Message bubble */}
          <div className="bg-[#f0fdf4] rounded-xl rounded-tl-none px-3 py-2.5 mb-3 border border-emerald-100">
            <p className="text-sm font-extrabold text-gray-900">{msg.emoji} {msg.text}</p>
            <p className="text-xs text-gray-600 mt-0.5 leading-snug">{msg.sub}</p>
          </div>

          {/* CTA */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20b858] text-white text-sm font-bold rounded-xl py-2.5 transition-colors shadow-sm"
          >
            <WaSvg />
            Chatear ahora
          </a>

          {/* Tail */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-b border-r border-gray-100 rotate-45" />
        </div>
      )}

      {/* ── WhatsApp floating button ── */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar por WhatsApp"
        className="group relative"
      >
      {/* Tooltip — slides in from left on hover, desktop only */}
      <div
        aria-hidden="true"
        className={[
          'hidden lg:flex items-center',
          'absolute right-full mr-3 top-1/2 -translate-y-1/2',
          'px-3 py-1.5',
          'bg-white/95 backdrop-blur-sm',
          'text-gray-800 text-xs font-semibold',
          'rounded-xl shadow-lg border border-gray-100/80',
          'whitespace-nowrap pointer-events-none select-none',
          'opacity-0 group-hover:opacity-100',
          'translate-x-2 group-hover:translate-x-0',
          'transition-all duration-300 ease-out',
        ].join(' ')}
      >
        Asesor por WhatsApp
      </div>

      {/* Circle button */}
      <div
        className={[
          'relative w-12 h-12 lg:w-[52px] lg:h-[52px]',
          'rounded-full bg-[#25D366]',
          'flex items-center justify-center',
          'shadow-[0_4px_16px_0_rgba(37,211,102,0.38)]',
          'group-hover:shadow-[0_8px_24px_0_rgba(37,211,102,0.50)]',
          'group-hover:-translate-y-1 group-hover:scale-105',
          'active:scale-95 active:translate-y-0',
          'transition-all duration-300 ease-out',
          'cursor-pointer overflow-visible',
        ].join(' ')}
      >
        <WaSvg />
        {/* Slow, subtle pulse ring */}
        <span
          className="absolute inset-0 rounded-full bg-[#25D366] opacity-[0.28] animate-ping pointer-events-none"
          style={{ animationDuration: '3s' }}
        />
      </div>
    </a>
    </div>
  );
}
