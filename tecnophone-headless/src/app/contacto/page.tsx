import { Metadata } from 'next';
import ContactoClient from './ContactoClient';

export const metadata: Metadata = {
  title: 'Contacto · Te llamamos, WhatsApp, soporte | TecnoPhone',
  description:
    'Contáctanos como prefieras: WhatsApp, llamada directa, solicitud de llamada gratis o formulario de soporte. Estamos en Chía, Cundinamarca. Asesoría personalizada Lun–Sáb 9am–7pm.',
  keywords: [
    'contacto tecnophone',
    'whatsapp tecnophone',
    'soporte tecnophone',
    'llamada gratis tecnophone',
    'asesor tecnophone',
  ],
  alternates: { canonical: 'https://tecnophone.co/contacto' },
};

export default function ContactoPage() {
  return <ContactoClient />;
}
