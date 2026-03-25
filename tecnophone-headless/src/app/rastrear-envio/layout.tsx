import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rastrear Envío — Seguimiento de Paquete en Tiempo Real | TecnoPhone',
  description:
    'Rastrea tu envío de TecnoPhone en tiempo real. Ingresa tu número de guía y consulta el estado de tu paquete: en camino, en reparto o entregado. Seguimiento de pedidos Colombia.',
  keywords: [
    'rastrear envío',
    'rastrear envío colombia',
    'seguimiento de paquete',
    'número de guía',
    'rastrear pedido',
    'seguimiento envío',
    'donde esta mi pedido',
    'tracking colombia',
    'consultar guía envío',
  ],
  openGraph: {
    title: 'Rastrear Envío — Seguimiento en Tiempo Real',
    description: 'Consulta el estado de tu pedido TecnoPhone con tu número de guía.',
    type: 'website',
  },
};

export default function RastrearEnvioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
