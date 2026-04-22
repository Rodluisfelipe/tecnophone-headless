'use client';

import { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  PhoneCall,
  Ticket,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import ContactForms from './ContactForms';

const WA_NUMBER = '573132294533';
const WA_MSG = 'Hola%20TecnoPhone%2C%20vengo%20de%20la%20p%C3%A1gina%20de%20contacto';
const PHONE = '3132294533';
const PHONE_DISPLAY = '313 229 4533';
const EMAIL = 'ventas@tecnophone.co';

type Tab = 'callback' | 'ticket';

export default function ContactoClient() {
  const [activeTab, setActiveTab] = useState<Tab>('callback');

  const scrollToForms = (tab: Tab) => {
    setActiveTab(tab);
    document.getElementById('forms-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative">
      {/* Decorative background */}
      <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-primary-50 via-white to-transparent pointer-events-none" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-r from-emerald-200/30 via-primary-200/40 to-orange-200/30 blur-3xl rounded-full pointer-events-none" />

      <div className="container-custom relative py-10 lg:py-14">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="text-center mb-12 lg:mb-14">
            <div className="inline-flex items-center gap-2 bg-white shadow-sm border border-primary-100 text-primary-700 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full mb-5">
              <Sparkles className="w-3.5 h-3.5" /> Atención humana, sin bots
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight mb-4">
              Hablemos.{' '}
              <span className="bg-gradient-to-r from-primary-600 via-emerald-600 to-primary-600 bg-clip-text text-transparent">
                Estamos para ayudarte
              </span>
            </h1>
            <p className="text-base md:text-lg text-surface-600 max-w-2xl mx-auto leading-relaxed">
              Elige el canal que prefieras. Respondemos en minutos por WhatsApp,
              o déjanos tus datos y nosotros te contactamos.
            </p>
          </header>

          {/* QUICK ACTIONS — coloridas pero coherentes */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            <a
              href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-2xl bg-white border border-emerald-200/70 p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-300/40 mb-4">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold text-gray-900 mb-1">WhatsApp</div>
                <div className="text-xs text-surface-500 mb-4">Respuesta en minutos</div>
                <span className="text-sm font-semibold text-emerald-700 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Escribir <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </a>

            <a
              href={`tel:${PHONE}`}
              className="group relative overflow-hidden rounded-2xl bg-white border border-blue-200/70 p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full group-hover:scale-150 transition-transform" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm shadow-blue-300/40 mb-4">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold text-gray-900 mb-1">Llamar ya</div>
                <div className="text-xs text-surface-500 mb-4">Lun–Sáb 9am–7pm</div>
                <span className="text-sm font-semibold text-blue-700 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  {PHONE_DISPLAY} <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </a>

            <button
              onClick={() => scrollToForms('callback')}
              className="group relative overflow-hidden rounded-2xl bg-white border border-orange-200/70 p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all text-left"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 rounded-full group-hover:scale-150 transition-transform" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm shadow-orange-300/40 mb-4">
                  <PhoneCall className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold text-gray-900 mb-1">Te llamamos</div>
                <div className="text-xs text-surface-500 mb-4">Sin costo · 24h</div>
                <span className="text-sm font-semibold text-orange-700 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Solicitar <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </button>

            <button
              onClick={() => scrollToForms('ticket')}
              className="group relative overflow-hidden rounded-2xl bg-white border border-purple-200/70 p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all text-left"
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full group-hover:scale-150 transition-transform" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-sm shadow-purple-300/40 mb-4">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <div className="font-bold text-gray-900 mb-1">Soporte</div>
                <div className="text-xs text-surface-500 mb-4">Respuesta en 24h</div>
                <span className="text-sm font-semibold text-purple-700 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Abrir ticket <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </button>
          </div>

          {/* MAIN GRID */}
          <div
            id="forms-section"
            className="grid lg:grid-cols-[1.4fr_1fr] gap-6 lg:gap-8 scroll-mt-8"
          >
            {/* FORMS CARD */}
            <div className="bg-white rounded-3xl border border-surface-200 shadow-md shadow-surface-200/50 overflow-hidden">
              {/* Tabs header */}
              <div className="flex border-b border-surface-200 bg-surface-50/50">
                <button
                  onClick={() => setActiveTab('callback')}
                  className={`flex-1 px-5 py-4 text-sm font-semibold transition relative ${
                    activeTab === 'callback'
                      ? 'text-orange-600 bg-white'
                      : 'text-surface-500 hover:text-surface-800'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <PhoneCall className="w-4 h-4" /> Te llamamos
                  </span>
                  {activeTab === 'callback' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('ticket')}
                  className={`flex-1 px-5 py-4 text-sm font-semibold transition relative ${
                    activeTab === 'ticket'
                      ? 'text-purple-600 bg-white'
                      : 'text-surface-500 hover:text-surface-800'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Ticket className="w-4 h-4" /> Crear ticket
                  </span>
                  {activeTab === 'ticket' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-400 to-purple-600" />
                  )}
                </button>
              </div>

              <div className="p-6 md:p-8">
                {activeTab === 'callback' && (
                  <>
                    <div className="flex items-start gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shrink-0">
                        <PhoneCall className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900">
                          Déjanos tu número
                        </h2>
                        <p className="text-sm text-surface-600">
                          Un asesor te llamará en el horario que elijas. Sin costo.
                        </p>
                      </div>
                    </div>
                    <ContactForms variant="callback" />
                  </>
                )}

                {activeTab === 'ticket' && (
                  <>
                    <div className="flex items-start gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shrink-0">
                        <Ticket className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900">
                          Cuéntanos qué necesitas
                        </h2>
                        <p className="text-sm text-surface-600">
                          Para garantías, pedidos o consultas detalladas. Respuesta en 24h hábiles.
                        </p>
                      </div>
                    </div>
                    <ContactForms variant="ticket" />
                  </>
                )}
              </div>
            </div>

            {/* SIDEBAR */}
            <aside className="space-y-4">
              {/* WhatsApp highlight */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700 p-6 text-white shadow-lg shadow-emerald-500/20">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/5 rounded-full" />
                <div className="relative">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                    <Zap className="w-3 h-3" /> Más rápido
                  </div>
                  <h3 className="text-xl font-bold mb-2">WhatsApp directo</h3>
                  <p className="text-sm text-emerald-50 mb-5 leading-relaxed">
                    Te respondemos en minutos. Productos, envíos, garantías o lo que necesites.
                  </p>
                  <a
                    href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-emerald-50 hover:shadow-lg transition-all"
                  >
                    <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
                  </a>
                </div>
              </div>

              {/* Contact info */}
              <div className="bg-white rounded-2xl border border-surface-200 p-5 space-y-4 shadow-sm">
                <InfoRow
                  icon={<Phone className="w-4 h-4" />}
                  iconBg="bg-blue-100 text-blue-600"
                  label="Teléfono"
                  value={PHONE_DISPLAY}
                  href={`tel:${PHONE}`}
                />
                <InfoRow
                  icon={<Mail className="w-4 h-4" />}
                  iconBg="bg-primary-100 text-primary-600"
                  label="Correo"
                  value={EMAIL}
                  href={`mailto:${EMAIL}`}
                />
                <InfoRow
                  icon={<MapPin className="w-4 h-4" />}
                  iconBg="bg-orange-100 text-orange-600"
                  label="Ubicación"
                  value="Chía, Cundinamarca"
                />
                <InfoRow
                  icon={<Clock className="w-4 h-4" />}
                  iconBg="bg-purple-100 text-purple-600"
                  label="Horario"
                  value="Lun–Sáb · 9:00 – 19:00"
                  hint="Domingos cerrado"
                />
              </div>

              {/* Trust card */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-bold">Compra con confianza</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-400 rounded-full" />
                    Productos 100% originales
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-400 rounded-full" />
                    Garantía oficial del fabricante
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-400 rounded-full" />
                    Envíos a todo Colombia
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-400 rounded-full" />
                    Factura electrónica
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  iconBg,
  label,
  value,
  href,
  hint,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  href?: string;
  hint?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 group">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-surface-500 mb-0.5">{label}</div>
        <div className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
          {value}
        </div>
        {hint && <div className="text-xs text-surface-500 mt-0.5">{hint}</div>}
      </div>
    </div>
  );

  return href ? (
    <a href={href} className="block">
      {content}
    </a>
  ) : (
    content
  );
}
