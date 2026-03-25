import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pagar con Nequi — Compra Tecnología Fácil y Seguro | TecnoPhone',
  description:
    'Compra celulares, portátiles y tecnología en TecnoPhone pagando con Nequi. Pago rápido, seguro y sin complicaciones. Guía paso a paso para pagar con tu cuenta Nequi.',
  keywords: [
    'pagar con nequi',
    'comprar con nequi',
    'nequi pagos',
    'pagar celular nequi',
    'nequi tecnología',
    'comprar tecnología nequi',
    'nequi colombia',
    'pago nequi online',
  ],
  openGraph: {
    title: 'Pagar con Nequi en TecnoPhone — Fácil y Seguro',
    description: 'Compra tecnología pagando con Nequi. Rápido, seguro y sin complicaciones.',
    type: 'website',
  },
};

export default function NequiPagosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
