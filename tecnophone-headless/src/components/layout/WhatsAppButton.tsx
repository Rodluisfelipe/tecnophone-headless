'use client';

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/573132294533?text=Hola%20TecnoPhone%2C%20me%20gustar%C3%ADa%20recibir%20asesor%C3%ADa"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed z-40 group right-4 bottom-20 lg:right-6 lg:bottom-[96px] wa-enter"
    >
      {/* Tooltip — slides in from left on hover, desktop only */}
      <div
        aria-hidden="true"
        className={[
          'hidden lg:flex items-center',
          'absolute right-full mr-3',
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
        {/* WhatsApp SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[26px] h-[26px] relative z-10"
          aria-hidden="true"
        >
          <path d="M20.472 3.506C18.202 1.234 15.17 0 11.974 0 5.42 0 .074 5.346.074 11.9c0 2.096.548 4.142 1.589 5.948L0 24l6.303-1.653a11.87 11.87 0 005.67 1.443h.005c6.549 0 11.895-5.347 11.895-11.901 0-3.18-1.239-6.166-3.401-8.383zm-8.498 18.3h-.004a9.86 9.86 0 01-5.022-1.372l-.36-.214-3.735.979 1-3.638-.234-.373a9.832 9.832 0 01-1.509-5.288c0-5.43 4.42-9.85 9.858-9.85 2.633 0 5.107 1.027 6.969 2.891a9.8 9.8 0 012.889 6.96c-.005 5.434-4.42 9.905-9.852 9.905zm5.405-7.387c-.296-.148-1.755-.866-2.027-.965-.273-.099-.47-.148-.668.149-.197.297-.765.964-.938 1.163-.173.198-.346.222-.642.074-.297-.148-1.252-.461-2.385-1.473-.882-.787-1.476-1.759-1.649-2.055-.173-.297-.018-.457.13-.605.134-.132.296-.346.445-.519.148-.174.197-.297.296-.495.099-.198.05-.371-.025-.52-.074-.148-.668-1.61-.915-2.204-.24-.578-.485-.5-.668-.51-.173-.006-.37-.007-.568-.007-.198 0-.52.074-.791.371-.272.297-1.037 1.015-1.037 2.474 0 1.46 1.062 2.87 1.21 3.068.148.198 2.09 3.19 5.064 4.475.708.306 1.259.489 1.69.625.71.226 1.357.194 1.868.118.569-.084 1.754-.717 2.001-1.41.247-.692.247-1.285.172-1.41-.074-.124-.272-.197-.568-.346z" />
        </svg>

        {/* Slow, subtle pulse ring */}
        <span
          className="absolute inset-0 rounded-full bg-[#25D366] opacity-[0.28] animate-ping pointer-events-none"
          style={{ animationDuration: '3s' }}
        />
      </div>
    </a>
  );
}
