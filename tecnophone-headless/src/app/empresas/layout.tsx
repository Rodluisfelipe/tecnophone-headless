import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Soluciones para Empresas — Descuentos Corporativos en Tecnología',
  description:
    'Equipa tu empresa con portátiles, monitores y periféricos a precios corporativos. Descuentos por volumen, garantía oficial y envío a toda Colombia.',
};

export default function EmpresasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
