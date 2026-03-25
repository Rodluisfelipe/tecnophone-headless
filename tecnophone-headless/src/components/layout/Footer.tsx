'use client';

import Link from 'next/link';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Instagram,
  MessageCircle,
  ArrowUpRight,
  Heart,
} from 'lucide-react';

const navLinks = [
  { href: '/productos', label: 'Todos los Productos' },
  { href: '/categoria/portatiles-2', label: 'Portátiles' },
  { href: '/categoria/celulares', label: 'Celulares' },
  { href: '/categoria/ofertas', label: 'Ofertas' },
  { href: '/empresas', label: 'Empresas' },
  { href: '/dolar-hoy', label: 'Dólar Hoy' },
  { href: '/salario-minimo', label: 'Salario Mínimo 2026' },
  { href: '/dia-de-la-madre', label: 'Día de la Madre' },
  { href: '/rastrear-envio', label: 'Rastrear Envío' },
  { href: '/nequi-pagos', label: 'Pagar con Nequi' },
  { href: '/blog', label: 'Blog' },
];

const legalLinks = [
  { href: '/politica-privacidad', label: 'Política de Privacidad' },
  { href: '/terminos-condiciones', label: 'Términos y Condiciones' },
  { href: '/politica-envios', label: 'Política de Envíos' },
  { href: '/derecho-retracto', label: 'Derecho de Retracto' },
];

const socials = [
  { href: 'https://www.facebook.com/tecnophone.co', icon: Facebook, label: 'Facebook', hoverBg: 'hover:bg-blue-500 hover:text-white hover:shadow-blue-500/30' },
  { href: 'https://www.instagram.com/tecnophone.co', icon: Instagram, label: 'Instagram', hoverBg: 'hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 hover:text-white hover:shadow-pink-500/30' },
  { href: 'https://wa.me/573132294533', icon: MessageCircle, label: 'WhatsApp', hoverBg: 'hover:bg-emerald-500 hover:text-white hover:shadow-emerald-500/30' },
];

const contactInfo = [
  { icon: Phone, text: '+57 313 229 4533', href: 'tel:+573132294533' },
  { icon: Mail, text: 'ventas@tecnophone.co', href: 'mailto:ventas@tecnophone.co' },
  { icon: MapPin, text: 'Chía, Cundinamarca, Colombia' },
  { icon: Clock, text: 'Lun - Sáb: 9:00 AM - 7:00 PM' },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Top border accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent" />

      <div className="bg-gray-50 text-gray-600 border-t border-surface-200">
        <div className="container-custom relative py-14 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="inline-block mb-5 group">
                <span className="text-2xl font-extrabold font-display">
                  <span className="text-primary-600">Tecno</span>
                  <span className="text-gray-900">Phone</span>
                </span>
              </Link>
              <p className="text-sm text-surface-700 mb-6 leading-relaxed">
                Tu tienda de tecnología de confianza en Colombia. Portátiles,
                celulares, accesorios y más con envío a todo el país.
              </p>
              <div className="flex gap-3">
                {socials.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 rounded-xl bg-surface-100 text-surface-600 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-surface-200 ${social.hoverBg} hover:border-transparent`}
                      aria-label={social.label}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="text-gray-900 font-bold mb-5 text-sm uppercase tracking-widest">Navegación</h3>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-all duration-300"
                    >
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-300">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-gray-900 font-bold mb-5 text-sm uppercase tracking-widest">Legal</h3>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-all duration-300"
                    >
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-300">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-gray-900 font-bold mb-5 text-sm uppercase tracking-widest">Contacto</h3>
              <ul className="space-y-4">
                {contactInfo.map((item) => {
                  const Icon = item.icon;
                  const content = (
                    <div className="flex items-start gap-3 group">
                      <div className="w-9 h-9 rounded-xl bg-surface-100 border border-surface-200 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-500/10 group-hover:border-primary-500/20 transition-all">
                        <Icon className="w-4 h-4 text-primary-600" />
                      </div>
                      <span className="text-sm text-surface-700 group-hover:text-primary-600 transition-colors pt-1.5">{item.text}</span>
                    </div>
                  );

                  if (item.href) {
                    return (
                      <li key={item.text}>
                        <a href={item.href} className="block">{content}</a>
                      </li>
                    );
                  }
                  return <li key={item.text}>{content}</li>;
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-surface-200">
          <div className="container-custom py-5 pb-20 lg:pb-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-surface-600">
            <p className="flex items-center gap-1">
              © {new Date().getFullYear()} TecnoPhone. Hecho con
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
              en Colombia
            </p>
            <p>Precios incluyen IVA · Envíos a todo Colombia</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
