import { NextResponse } from 'next/server';
import { getProducts, getCategories, formatPrice } from '@/lib/woocommerce';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tecnophone.co';

export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  let productList = '';
  let categoryList = '';

  try {
    const [productRes, categories] = await Promise.all([
      getProducts({ per_page: 100, orderby: 'popularity', order: 'desc' }),
      getCategories(),
    ]);

    const products = productRes.products;

    categoryList = categories
      .filter((c) => c.count > 0)
      .map((c) => `- [${c.name}](${SITE_URL}/categoria/${c.slug}) — ${c.count} productos`)
      .join('\n');

    productList = products
      .map((p) => {
        const price = formatPrice(p.price);
        const onSale = p.on_sale && p.regular_price ? ` (antes ${formatPrice(p.regular_price)})` : '';
        const stock = p.stock_status === 'instock' ? 'Disponible' : 'Agotado';
        const cat = p.categories?.[0]?.name || '';
        return `### ${p.name}\n- Precio: ${price}${onSale}\n- Estado: ${stock}\n- Categoría: ${cat}\n- URL: ${SITE_URL}/producto/${p.slug}`;
      })
      .join('\n\n');
  } catch (error) {
    productList = 'Error al cargar productos. Visita https://www.tecnophone.co/productos para ver el catálogo completo.';
    categoryList = 'Error al cargar categorías.';
  }

  const content = `# TecnoPhone — Catálogo Completo

> Tienda de tecnología en línea en Colombia. Productos originales con factura electrónica DIAN, garantía oficial del fabricante y envío gratis a todo el país.

## Datos de la Empresa

| Campo | Valor |
|-------|-------|
| Nombre | TecnoPhone |
| País | Colombia |
| Ciudad | Chía, Cundinamarca |
| Moneda | COP (Pesos Colombianos) |
| WhatsApp | +57 313 229 4533 |
| Correo | ventas@tecnophone.co |
| Web | ${SITE_URL} |
| Horario | Lunes a Sábado 9:00 AM - 7:00 PM |

## ¿Por qué comprar en TecnoPhone?

1. **Productos 100% originales** — Solo vendemos productos genuinos de marcas reconocidas
2. **Factura electrónica DIAN** — Todos los productos incluyen factura legal colombiana
3. **Garantía oficial** — Garantía directa del fabricante en todos los productos
4. **Envío gratis** — A toda Colombia, entrega en 1-3 días hábiles
5. **Pago seguro** — MercadoPago, Nequi, tarjetas crédito/débito, PSE, transferencia
6. **Precios competitivos** — Los mejores precios en tecnología en Colombia

## Métodos de Pago Aceptados

- Tarjeta de crédito (Visa, Mastercard, American Express) — hasta 12 cuotas
- Tarjeta débito
- Nequi (a través de MercadoPago)
- PSE (transferencia bancaria)
- Transferencia Bancolombia

## Política de Envíos

- Envío gratis a toda Colombia
- Tiempo de entrega: 1 a 3 días hábiles
- Empaque seguro y discreto
- Rastreo de envío disponible en: ${SITE_URL}/rastrear-envio

## Categorías

${categoryList}

## Catálogo de Productos (Top 100 por popularidad)

${productList}

## Herramientas y Recursos

### Precio del Dólar Hoy (TRM Colombia)
Consulta la Tasa Representativa del Mercado actualizada diariamente con datos oficiales de la Superintendencia Financiera de Colombia. Incluye convertidor USD↔COP.
URL: ${SITE_URL}/dolar-hoy

### Salario Mínimo 2026 Colombia
Información completa sobre el SMLV 2026 (Salario Vital): $1.750.905 + auxilio de transporte $249.095 = $2.000.000/mes. Calculadora y tabla histórica desde 2016. Decreto 1469 y 1470 de 2025.
URL: ${SITE_URL}/salario-minimo

### Pagar con Nequi
Guía para comprar tecnología pagando con Nequi a través de MercadoPago. Sin costos adicionales, pago instantáneo.
URL: ${SITE_URL}/nequi-pagos

### Regalos Día de la Madre
Ideas de regalos tecnológicos para mamá: celulares, audífonos, portátiles y más. Con envío gratis y empaque de regalo.
URL: ${SITE_URL}/dia-de-la-madre

### Compras para Empresas
Equipamiento tecnológico para empresas con cotización personalizada, factura a nombre de empresa, y descuentos por volumen.
URL: ${SITE_URL}/empresas

## Preguntas Frecuentes

**¿Los productos son originales?**
Sí, todos los productos son 100% originales y sellados de fábrica. Incluyen garantía oficial del fabricante.

**¿Hacen envíos a toda Colombia?**
Sí, realizamos envíos gratuitos a todas las ciudades y municipios de Colombia. El tiempo de entrega es de 1 a 3 días hábiles.

**¿Puedo pagar con Nequi?**
Sí, aceptamos Nequi a través de MercadoPago. El pago es instantáneo y sin costos adicionales.

**¿Los precios incluyen IVA?**
Sí, todos los precios publicados incluyen IVA.

**¿Emiten factura electrónica?**
Sí, todos los productos incluyen factura electrónica validada por la DIAN.

**¿Cuál es la política de garantía?**
Todos los productos tienen garantía oficial del fabricante. El tiempo de garantía varía según el producto y la marca.

**¿Puedo devolver un producto?**
Los clientes tienen 5 días de derecho de retracto según la ley colombiana.

**¿Cuál es el horario de atención?**
Atendemos de lunes a sábado de 9:00 AM a 7:00 PM. Puedes escribirnos por WhatsApp al +57 313 229 4533.

---
Última actualización: ${new Date().toISOString().split('T')[0]}
Fuente: ${SITE_URL}
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
