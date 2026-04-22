'use client';

import { useState, FormEvent } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Phone, Send } from 'lucide-react';

const ACCESS_KEY = 'e48307af-f388-4ccf-9d2f-0a307ad89f17';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

interface ContactFormsProps {
  variant: 'callback' | 'ticket';
}

const inputClass =
  'w-full rounded-xl border border-surface-200 bg-surface-50/50 px-4 py-3 text-sm text-gray-900 placeholder:text-surface-400 focus:bg-white focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all';

const labelClass = 'block text-sm font-semibold text-gray-800 mb-1.5';

const accent = {
  callback: {
    btn: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-300/40',
    icon: <Phone className="w-4 h-4" />,
  },
  ticket: {
    btn: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-300/40',
    icon: <Send className="w-4 h-4" />,
  },
};

export default function ContactForms({ variant }: ContactFormsProps) {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data: Record<string, string> = { access_key: ACCESS_KEY };
    formData.forEach((v, k) => {
      data[k] = v.toString();
    });

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setStatus('success');
        form.reset();
      } else {
        setStatus('error');
        setErrorMsg(json.message || 'Error al enviar. Intenta de nuevo.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Error de conexión. Verifica tu internet.');
    }
  }

  if (variant === 'callback') {
    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        <input type="hidden" name="subject" value="📞 Solicitud de llamada — TecnoPhone" />
        <input type="hidden" name="from_name" value="TecnoPhone Web — Te llamamos" />
        <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" />

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nombre <span className="text-red-500">*</span></label>
            <input name="nombre" type="text" required className={inputClass} placeholder="Juan Pérez" />
          </div>
          <div>
            <label className={labelClass}>Teléfono <span className="text-red-500">*</span></label>
            <input
              name="telefono"
              type="tel"
              required
              pattern="[0-9+\s\-()]{7,20}"
              className={inputClass}
              placeholder="3132294533"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>¿Cuándo te llamamos? <span className="text-red-500">*</span></label>
          <select
            name="horario"
            required
            defaultValue=""
            className={`${inputClass} cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%2212%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%23737373%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22><polyline%20points=%226%209%2012%2015%2018%209%22/></svg>')] bg-no-repeat bg-[right_1rem_center] pr-10`}
          >
            <option value="" disabled>Selecciona un horario</option>
            <option value="Ahora mismo (próximos 30 min)">⚡ Ahora mismo</option>
            <option value="Mañana 9am - 12pm">🌅 Mañana · 9am – 12pm</option>
            <option value="Tarde 12pm - 3pm">☀️ Mediodía · 12pm – 3pm</option>
            <option value="Tarde 3pm - 6pm">🌤️ Tarde · 3pm – 6pm</option>
            <option value="Noche 6pm - 8pm">🌙 Noche · 6pm – 8pm</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>
            ¿Qué te interesa? <span className="text-surface-400 font-normal">(opcional)</span>
          </label>
          <input
            name="interes"
            type="text"
            className={inputClass}
            placeholder="iPhone 15, laptop, asesoría general..."
          />
        </div>

        <SubmitArea
          status={status}
          errorMsg={errorMsg}
          label="Solicitar llamada gratis"
          successText="Recibimos tu solicitud. Un asesor te llamará pronto."
          variant={variant}
        />

        <p className="text-xs text-surface-500 flex items-center gap-1.5 pt-1">
          🔒 Tus datos solo se usan para llamarte. No spam.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="subject" value="🎫 Nueva consulta / ticket — TecnoPhone" />
      <input type="hidden" name="from_name" value="TecnoPhone Web — Ticket" />
      <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nombre <span className="text-red-500">*</span></label>
          <input name="nombre" type="text" required className={inputClass} placeholder="Tu nombre" />
        </div>
        <div>
          <label className={labelClass}>Email <span className="text-red-500">*</span></label>
          <input name="email" type="email" required className={inputClass} placeholder="tu@correo.com" />
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Teléfono <span className="text-surface-400 font-normal">(opcional)</span>
        </label>
        <input name="telefono" type="tel" className={inputClass} placeholder="Para responderte por WhatsApp" />
      </div>

      <div>
        <label className={labelClass}>Tipo de consulta <span className="text-red-500">*</span></label>
        <select
          name="tipo_consulta"
          required
          defaultValue=""
          className={`${inputClass} cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%2212%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%23737373%22%20stroke-width=%222%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22><polyline%20points=%226%209%2012%2015%2018%209%22/></svg>')] bg-no-repeat bg-[right_1rem_center] pr-10`}
        >
          <option value="" disabled>Selecciona</option>
          <option value="Soporte post-venta">🛡️ Soporte / garantía</option>
          <option value="Estado de mi pedido">📦 Estado de mi pedido</option>
          <option value="Información de producto">🛍️ Información de producto</option>
          <option value="Compras corporativas">🏢 Compras corporativas</option>
          <option value="Devolución / cambio">🔄 Devolución / cambio</option>
          <option value="Otra">💬 Otra</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>
          Número de pedido <span className="text-surface-400 font-normal">(si aplica)</span>
        </label>
        <input name="numero_pedido" type="text" className={inputClass} placeholder="#12345" />
      </div>

      <div>
        <label className={labelClass}>Mensaje <span className="text-red-500">*</span></label>
        <textarea
          name="mensaje"
          required
          rows={4}
          minLength={10}
          className={`${inputClass} resize-none`}
          placeholder="Cuéntanos en detalle cómo podemos ayudarte..."
        />
      </div>

      <SubmitArea
        status={status}
        errorMsg={errorMsg}
        label="Enviar consulta"
        successText="Mensaje recibido. Te responderemos en menos de 24h hábiles."
        variant={variant}
      />

      <p className="text-xs text-surface-500 pt-1">
        🔒 Tu información solo se usa para responder tu consulta.
      </p>
    </form>
  );
}

function SubmitArea({
  status,
  errorMsg,
  label,
  successText,
  variant,
}: {
  status: FormStatus;
  errorMsg: string;
  label: string;
  successText: string;
  variant: 'callback' | 'ticket';
}) {
  const a = accent[variant];
  return (
    <div className="space-y-3 pt-1">
      <button
        type="submit"
        disabled={status === 'sending' || status === 'success'}
        className={`w-full inline-flex items-center justify-center gap-2 ${a.btn} disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-6 py-3.5 rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]`}
      >
        {status === 'sending' && (<><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>)}
        {status === 'success' && (<><CheckCircle2 className="w-5 h-5" /> ¡Enviado!</>)}
        {(status === 'idle' || status === 'error') && (<>{a.icon} {label}</>)}
      </button>

      {status === 'success' && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <p className="font-bold">¡Listo!</p>
            <p className="text-xs mt-0.5 text-emerald-700">{successText}</p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 flex gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <p>{errorMsg || 'Algo falló. Escríbenos por WhatsApp.'}</p>
        </div>
      )}
    </div>
  );
}
