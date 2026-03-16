'use client';

import { useState, useRef, useEffect } from 'react';
import { X, PackageSearch, Loader2, MapPin, Calendar, Truck, AlertCircle } from 'lucide-react';

interface TrackingResult {
  exito: boolean;
  guia: string;
  estado: string;
  origen: string | null;
  destino: string | null;
  fechaEnvio: string | null;
  fechaEntrega: string | null;
  primerosMovimientos: Array<{
    descripcion: string;
    fecha: string;
    ubicacion: string;
  }>;
  totalMovimientos: number;
  error?: string;
}

export default function TrackingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [guia, setGuia] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setResult(null);
      setError('');
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guia.trim();
    if (!trimmed) return;
    if (!/^\d{6,30}$/.test(trimmed)) {
      setError('Ingresa un número de guía válido (solo dígitos).');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/tracking?guia=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'No se pudo consultar la guía.');
      } else if (!data.exito) {
        setError(data.error || 'No se encontró información para esta guía.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const estadoColor = result
    ? /entregad|recibid/i.test(result.estado)
      ? 'text-emerald-600 bg-emerald-50'
      : /ruta|distribu|camino|transito/i.test(result.estado)
        ? 'text-blue-600 bg-blue-50'
        : 'text-amber-600 bg-amber-50'
    : '';

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex items-start justify-center pt-[12vh] px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-gray-200/60 border border-surface-200 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">Seguir envío</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search form */}
          <form onSubmit={handleSubmit} className="px-5 py-4">
            <label htmlFor="tracking-guia" className="text-xs font-semibold text-gray-700 mb-1.5 block">
              Número de guía
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id="tracking-guia"
                type="text"
                inputMode="numeric"
                value={guia}
                onChange={(e) => { setGuia(e.target.value.replace(/\D/g, '')); setError(''); }}
                placeholder="Ej: 1234567890"
                className="flex-1 px-4 py-2.5 bg-white border border-surface-300 rounded-xl text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                maxLength={30}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={loading || !guia.trim()}
                className="px-4 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageSearch className="w-4 h-4" />}
                Buscar
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="mx-5 mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="px-5 pb-5 space-y-3">
              {/* Status badge */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${estadoColor}`}>
                  <Truck className="w-3.5 h-3.5" />
                  {result.estado}
                </span>
                <span className="text-[11px] text-gray-500">
                  Guía: <span className="font-mono font-bold text-gray-700">{result.guia}</span>
                </span>
              </div>

              {/* Route */}
              {(result.origen || result.destino) && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-50 border border-surface-200">
                  <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    {result.origen && <span className="font-semibold">{result.origen}</span>}
                    {result.origen && result.destino && <span className="mx-1.5 text-gray-400">→</span>}
                    {result.destino && <span className="font-semibold">{result.destino}</span>}
                  </div>
                </div>
              )}

              {/* Dates */}
              {(result.fechaEnvio || result.fechaEntrega) && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-50 border border-surface-200">
                  <Calendar className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <div className="text-sm text-gray-700 space-y-0.5">
                    {result.fechaEnvio && <p>Enviado: <span className="font-semibold">{result.fechaEnvio}</span></p>}
                    {result.fechaEntrega && <p>Entregado: <span className="font-semibold">{result.fechaEntrega}</span></p>}
                  </div>
                </div>
              )}

              {/* First 3 movements */}
              {result.primerosMovimientos && result.primerosMovimientos.length > 0 && (
                <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Últimos movimientos</p>
                  <ol className="space-y-1">
                    {result.primerosMovimientos.map((mov, idx) => (
                      <li key={idx} className="border-l-2 border-primary-200 pl-3 relative">
                        <span className="absolute left-0 top-1 w-2 h-2 rounded-full bg-primary-400" />
                        <span className="text-sm font-semibold text-gray-900">{mov.descripcion}</span>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          {mov.fecha && <span>{mov.fecha}</span>}
                          {mov.ubicacion && <span>📍 {mov.ubicacion}</span>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="px-5 pb-5 flex items-center justify-center gap-2 py-6">
              <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
              <span className="text-sm text-gray-500">Consultando...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
