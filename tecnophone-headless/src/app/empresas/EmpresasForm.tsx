'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

export default function EmpresasForm() {
  const [form, setForm] = useState({
    empresa: '',
    contacto: '',
    telefono: '',
    empleados: '',
    necesidad: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = [
      `Hola, soy ${form.contacto} de *${form.empresa}*.`,
      form.empleados ? `Somos aproximadamente ${form.empleados} empleados.` : '',
      form.necesidad ? `Necesitamos: ${form.necesidad}` : '',
      form.telefono ? `Mi teléfono: ${form.telefono}` : '',
      'Me gustaría recibir una cotización corporativa.',
    ]
      .filter(Boolean)
      .join('\n');

    window.open(
      `https://wa.me/573132294533?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-surface-200 shadow-xl shadow-gray-200/50 p-6 lg:p-10 space-y-6">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="empresa" className="block text-sm font-bold text-gray-700 mb-2">
            Nombre de la empresa *
          </label>
          <input
            id="empresa"
            name="empresa"
            type="text"
            required
            maxLength={100}
            value={form.empresa}
            onChange={handleChange}
            className="w-full px-4 py-3.5 rounded-xl border border-surface-300 bg-surface-50 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white outline-none transition-all"
            placeholder="Ej: Mi Empresa SAS"
          />
        </div>
        <div>
          <label htmlFor="contacto" className="block text-sm font-bold text-gray-700 mb-2">
            Nombre de contacto *
          </label>
          <input
            id="contacto"
            name="contacto"
            type="text"
            required
            maxLength={80}
            value={form.contacto}
            onChange={handleChange}
            className="w-full px-4 py-3.5 rounded-xl border border-surface-300 bg-surface-50 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white outline-none transition-all"
            placeholder="Tu nombre completo"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="telefono" className="block text-sm font-bold text-gray-700 mb-2">
            Teléfono / Celular
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            maxLength={15}
            value={form.telefono}
            onChange={handleChange}
            className="w-full px-4 py-3.5 rounded-xl border border-surface-300 bg-surface-50 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white outline-none transition-all"
            placeholder="300 123 4567"
          />
        </div>
        <div>
          <label htmlFor="empleados" className="block text-sm font-bold text-gray-700 mb-2">
            Cantidad de empleados
          </label>
          <select
            id="empleados"
            name="empleados"
            value={form.empleados}
            onChange={handleChange}
            className="w-full px-4 py-3.5 rounded-xl border border-surface-300 bg-surface-50 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white outline-none transition-all"
          >
            <option value="">Seleccionar</option>
            <option value="1-10">1 - 10</option>
            <option value="11-50">11 - 50</option>
            <option value="51-200">51 - 200</option>
            <option value="200+">200+</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="necesidad" className="block text-sm font-bold text-gray-700 mb-2">
          ¿Qué necesitas? *
        </label>
        <textarea
          id="necesidad"
          name="necesidad"
          required
          maxLength={500}
          rows={4}
          value={form.necesidad}
          onChange={handleChange}
          className="w-full px-4 py-3.5 rounded-xl border border-surface-300 bg-surface-50 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white outline-none transition-all resize-none"
          placeholder="Ej: Necesitamos 20 portátiles para nuestra oficina, monitores de 24&quot; y teclados inalámbricos..."
        />
      </div>

      <button
        type="submit"
        className="w-full bg-green-500 hover:bg-green-600 text-white font-extrabold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-500/25 hover:-translate-y-0.5 text-base"
      >
        <MessageCircle className="w-5 h-5" />
        Enviar solicitud por WhatsApp
      </button>

      <p className="text-xs text-center text-surface-600">
        Al enviar, serás redirigido a WhatsApp con tu solicitud pre-llenada. Respondemos en menos de 2 horas en horario laboral.
      </p>
    </form>
  );
}
