import { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Contáctanos por WhatsApp, teléfono o correo. Estamos en Chía, Cundinamarca. Asesoría personalizada en tecnología.',
};

export default function ContactoPage() {
  return (
    <div className="container-custom py-8 lg:py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Contacto</h1>
        <p className="text-surface-700 mb-10">
          Estamos aquí para ayudarte. Contáctanos por el medio que prefieras.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                WhatsApp (Preferido)
              </h2>
              <p className="text-sm text-surface-700 mb-4">
                La forma más rápida de comunicarte con nosotros. Respuesta inmediata.
              </p>
              <a
                href="https://wa.me/573132294533?text=Hola%2C%20necesito%20ayuda"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Escribir por WhatsApp
              </a>
            </div>

            <div className="bg-surface-100 rounded-2xl p-6 space-y-5 border border-surface-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Teléfono</h3>
                  <a
                    href="tel:+573132294533"
                    className="text-sm text-surface-700 hover:text-primary-600 transition-colors"
                  >
                    +57 313 229 4533
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Correo</h3>
                  <a
                    href="mailto:ventas@tecnophone.co"
                    className="text-sm text-surface-700 hover:text-primary-600 transition-colors"
                  >
                    ventas@tecnophone.co
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Ubicación</h3>
                  <p className="text-sm text-surface-700">Chía, Cundinamarca, Colombia</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Horario</h3>
                  <p className="text-sm text-surface-700">Lunes a Sábado: 9:00 AM - 7:00 PM</p>
                  <p className="text-sm text-surface-600">Domingos: Cerrado</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map placeholder / CTA */}
          <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-2xl p-8 text-white flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-4">¿Necesitas asesoría?</h2>
            <p className="text-primary-100 mb-6 leading-relaxed">
              Nuestro equipo de asesores te ayudará a elegir el producto perfecto
              para tus necesidades. Ya sea un portátil para trabajo, un celular
              con la mejor cámara, o cualquier equipo de tecnología.
            </p>
            <ul className="space-y-3 text-sm text-primary-100 mb-8">
              <li className="flex items-center gap-2">
                ✓ Asesoría personalizada
              </li>
              <li className="flex items-center gap-2">
                ✓ Productos 100% originales
              </li>
              <li className="flex items-center gap-2">
                ✓ Garantía oficial del fabricante
              </li>
              <li className="flex items-center gap-2">
                ✓ Envíos a todo Colombia
              </li>
              <li className="flex items-center gap-2">
                ✓ Factura electrónica
              </li>
            </ul>
            <a
              href="https://wa.me/573132294533?text=Hola%2C%20necesito%20asesoría%20para%20elegir%20un%20producto"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-accent w-full text-center"
            >
              <MessageCircle className="w-5 h-5" />
              Iniciar Chat
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
