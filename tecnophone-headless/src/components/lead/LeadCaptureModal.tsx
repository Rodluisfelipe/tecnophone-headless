'use client';

import { useEffect, useState, FormEvent } from 'react';
import { Gift, X, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { useLeadStore } from '@/store/lead';
import { useCartStore } from '@/store/cart';

const ACCESS_KEY = 'e48307af-f388-4ccf-9d2f-0a307ad89f17';

export default function LeadCaptureModal() {
  const isModalOpen = useLeadStore((s) => s.isModalOpen);
  const triggerSource = useLeadStore((s) => s.triggerSource);
  const closeModal = useLeadStore((s) => s.closeModal);
  const dismiss = useLeadStore((s) => s.dismiss);
  const setLead = useLeadStore((s) => s.setLead);

  const cartTotal = useCartStore((s) => s.totalPrice());
  const cartCount = useCartStore((s) => s.totalItems());

  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    useLeadStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = (fd.get('nombre') as string)?.trim() || '';
    const phone = (fd.get('telefono') as string)?.trim() || '';
    const company = ((fd.get('empresa') as string) || '').trim();

    const payload: Record<string, string> = {
      access_key: ACCESS_KEY,
      subject: `[LEAD] Captura envío gratis — ${name}`,
      from_name: 'TecnoPhone Web — Lead Capture',
      nombre: name,
      telefono: phone,
      empresa: company || '—',
      opt_in_whatsapp: 'Sí',
      source: triggerSource || 'banner',
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      cart_value: cartTotal > 0 ? cartTotal.toString() : '0',
      cart_items: cartCount.toString(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      botcheck: '',
    };

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Error al enviar');

      setLead({
        name,
        phone,
        company: company || undefined,
        capturedAt: Date.now(),
        source: triggerSource || 'banner',
      });
      setSuccess(true);
      window.setTimeout(() => closeModal(), 2400);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setSubmitting(false);
    }
  }

  // Trigger ahora vive en la Navbar (LeadNavTrigger). Aquí solo renderizamos el modal.
  return (
    <>
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Asegura tu envío gratis"
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={dismiss}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="relative w-full sm:w-auto sm:max-w-md animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
            <div className="relative bg-white shadow-2xl shadow-gray-900/20 border-t sm:border border-surface-200 rounded-t-2xl sm:rounded-2xl overflow-hidden sm:w-[420px]">
              {/* Header con franja verde */}
              <div className="relative bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-4 pr-12">
                <button
                  onClick={dismiss}
                  aria-label="Cerrar"
                  className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-white" strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white leading-tight">
                      Asegura tu Envío GRATIS
                    </h3>
                    <p className="text-[11px] sm:text-xs text-emerald-50/90 mt-0.5">
                      Te avisamos del estado de tu pedido
                    </p>
                  </div>
                </div>
              </div>

              {success ? (
                <div className="p-6 text-center pb-[max(env(safe-area-inset-bottom),1.5rem)]">
                  <CheckCircle2 className="mx-auto mb-3 w-12 h-12 text-emerald-600" />
                  <p className="text-base font-bold text-gray-900">¡Listo! Envío GRATIS asegurado</p>
                  <p className="text-sm text-surface-600 mt-1">Te contactaremos por WhatsApp pronto.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] space-y-3">
                  <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" />

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Nombre</label>
                    <input
                      name="nombre"
                      type="text"
                      required
                      placeholder="Tu nombre"
                      className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-surface-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">WhatsApp</label>
                    <input
                      name="telefono"
                      type="tel"
                      required
                      pattern="[0-9+\s\-()]{7,20}"
                      placeholder="3XX XXX XXXX"
                      className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-surface-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                      Empresa <span className="text-surface-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      name="empresa"
                      type="text"
                      placeholder="Nombre de tu empresa"
                      className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-surface-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                  </div>

                  {error && <p className="text-xs text-red-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition-all disabled:opacity-60 shadow-md shadow-emerald-600/20"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4" />
                        Activar Envío GRATIS
                      </>
                    )}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-surface-500 pt-1">
                    <Lock className="w-3 h-3" />
                    Tus datos están seguros · No enviamos spam
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
