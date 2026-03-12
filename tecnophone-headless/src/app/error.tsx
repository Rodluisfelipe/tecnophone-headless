'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Error]', error);
  }, [error]);

  return (
    <div className="container-custom py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Algo salió mal</h2>
        <p className="text-surface-700 mb-6">
          Ocurrió un error inesperado. Por favor intenta de nuevo.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-surface-100 text-surface-800 px-6 py-3 rounded-xl font-bold hover:bg-surface-200 transition-colors border border-surface-200"
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
