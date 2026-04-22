import { getProducts } from '@/lib/woocommerce';
import SalarioClient from './SalarioClient';

export const revalidate = 86400; // ISR: refresh daily

const SALARIO_2026 = 1750905;
const AUX_2026 = 249095;

const FAQ_ITEMS = [
  {
    q: '¿Cuánto es el salario mínimo en Colombia 2026?',
    a: `El salario mínimo legal vigente (SMLV) en Colombia para 2026 es de $${SALARIO_2026.toLocaleString('es-CO')} pesos mensuales, más un auxilio de transporte de $${AUX_2026.toLocaleString('es-CO')} pesos, para un total devengado de $${(SALARIO_2026 + AUX_2026).toLocaleString('es-CO')} pesos.`,
  },
  {
    q: '¿Cuándo aumenta el salario mínimo en Colombia?',
    a: 'El salario mínimo se negocia entre el Gobierno, los sindicatos y los empresarios durante noviembre y diciembre de cada año. Si no hay acuerdo, el Gobierno lo fija por decreto antes del 30 de diciembre. El nuevo salario entra en vigencia el 1 de enero del año siguiente.',
  },
  {
    q: '¿El salario mínimo incluye el auxilio de transporte?',
    a: 'No. El auxilio de transporte se suma al salario mínimo y solo aplica para trabajadores que devengan hasta 2 SMLV. Para 2026, el auxilio es de $249.095 pesos mensuales.',
  },
  {
    q: '¿Cómo se calcula el salario mínimo neto a recibir?',
    a: 'Al salario mínimo se le descuenta 4% para salud y 4% para pensión (8% total). Para 2026, la deducción es de aproximadamente $140.072 pesos, dejando un neto de $1.859.928 pesos sumando el auxilio de transporte.',
  },
  {
    q: '¿Cuánto vale la hora extra con el salario mínimo 2026?',
    a: 'La hora ordinaria del salario mínimo 2026 vale aproximadamente $7.295. La hora extra diurna (recargo del 25%) equivale a $9.119, la nocturna (75%) a $12.766, y la dominical o festiva (75%) a $12.766.',
  },
  {
    q: '¿Cuánto es el salario mínimo por día y por hora en 2026?',
    a: `El salario mínimo diario en Colombia 2026 es de $${Math.round(SALARIO_2026 / 30).toLocaleString('es-CO')} pesos (sin contar auxilio de transporte), y el salario mínimo por hora es de $${Math.round(SALARIO_2026 / 240).toLocaleString('es-CO')} pesos basado en una jornada de 8 horas diarias.`,
  },
  {
    q: '¿Puedo comprar tecnología con un salario mínimo en Colombia?',
    a: 'Sí. En TecnoPhone hay productos desde menos de un salario mínimo (celulares, audífonos, accesorios). Para equipos de mayor valor, puedes pagar con tarjeta de crédito en hasta 36 cuotas a través de los métodos de pago disponibles en el checkout.',
  },
];

const HOW_TO_STEPS = [
  { name: 'Identifica tu salario base mensual', text: `Para 2026 en Colombia, el salario mínimo legal vigente es de $${SALARIO_2026.toLocaleString('es-CO')} pesos.` },
  { name: 'Suma el auxilio de transporte', text: `Si ganas hasta 2 SMLV, suma $${AUX_2026.toLocaleString('es-CO')} pesos de auxilio de transporte.` },
  { name: 'Calcula las deducciones de ley', text: 'Resta el 4% de salud y 4% de pensión sobre el salario base (no sobre el auxilio).' },
  { name: 'Obtén el salario neto', text: 'El resultado es lo que recibes en tu cuenta bancaria mensualmente.' },
];

export const metadata = {
  alternates: { canonical: 'https://tecnophone.co/salario-minimo' },
};

export default async function SalarioMinimoPage() {
  const productRes = await getProducts({ per_page: 30, orderby: 'price', order: 'asc' });

  const products = productRes.products.map((p) => ({
    name: p.name,
    slug: p.slug,
    price: p.price,
    regular_price: p.regular_price,
    images: p.images.map((img) => ({ src: img.src })),
    on_sale: p.on_sale,
  }));

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Cómo calcular el salario mínimo neto en Colombia 2026',
    description: 'Guía paso a paso para calcular el salario mínimo neto que recibirás en tu cuenta bancaria.',
    totalTime: 'PT2M',
    step: HOW_TO_STEPS.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <SalarioClient products={products} faqItems={FAQ_ITEMS} />
    </>
  );
}
