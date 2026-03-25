import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Regalos Tecnología Día de la Madre 2026 — Ideas desde $99.900 | TecnoPhone',
  description:
    'Los mejores regalos tecnológicos para el Día de la Madre 2026 en Colombia. Celulares, audífonos, portátiles y más con envío gratis, garantía oficial y factura DIAN. Sorpréndela con tecnología.',
  keywords: [
    'regalo día de la madre',
    'regalos tecnología madre',
    'día de la madre 2026 colombia',
    'regalo celular madre',
    'regalo tecnológico mamá',
    'que regalar día de la madre',
    'ideas regalo madre colombia',
    'audífonos regalo mamá',
  ],
  openGraph: {
    title: 'Regalos Tecnología Día de la Madre 2026 — Sorpréndela',
    description: 'Ideas de regalo tecnológico para mamá. Envío gratis + garantía oficial.',
    type: 'website',
  },
};

export default function DiaDeLaMadreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
