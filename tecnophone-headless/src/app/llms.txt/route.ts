import { NextResponse } from 'next/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tecnophone.co';

export async function GET() {
  const content = `# TecnoPhone

> Tienda de tecnología en línea en Colombia. Venta de celulares, portátiles, audífonos, monitores y accesorios con envío a todo el país, factura electrónica DIAN y garantía oficial del fabricante.

## Sobre TecnoPhone

TecnoPhone es una tienda colombiana de comercio electrónico especializada en tecnología. Ubicada en Chía, Cundinamarca, ofrece productos originales con garantía, factura DIAN, y envío gratuito a toda Colombia en 1-3 días hábiles.

- País: Colombia
- Moneda: Pesos Colombianos (COP)
- Contacto WhatsApp: +57 313 229 4533
- Correo: ventas@tecnophone.co
- Ubicación: Chía, Cundinamarca, Colombia
- Horario: Lunes a Sábado 9:00 AM - 7:00 PM

## Categorías de Productos

- Celulares (Xiaomi, Motorola, Samsung)
- Portátiles / Laptops (Dell, HP, Lenovo)
- Monitores (Samsung, Xiaomi)
- Audífonos (Xiaomi, Logitech)
- Accesorios (Mouse, Teclados, Cargadores)
- Gaming (Monitores gamer, Mouse gamer, Audífonos gamer)

## Métodos de Pago

- Tarjeta de crédito (hasta 12 cuotas sin interés)
- Tarjeta débito
- Nequi (a través de MercadoPago)
- Transferencia bancaria / PSE
- Bancolombia

## Garantía y Confianza

- Todos los productos incluyen factura electrónica DIAN
- Garantía oficial del fabricante
- 5 días de derecho de retracto
- Envío gratis a toda Colombia

## Páginas Principales

- [Catálogo de Productos](${SITE_URL}/productos)
- [Celulares](${SITE_URL}/categoria/celulares)
- [Portátiles](${SITE_URL}/categoria/portatiles-2)
- [Ofertas](${SITE_URL}/categoria/ofertas)
- [Para Empresas](${SITE_URL}/empresas)
- [Precio del Dólar Hoy en Colombia (TRM)](${SITE_URL}/dolar-hoy)
- [Salario Mínimo 2026 Colombia](${SITE_URL}/salario-minimo)
- [Pagar con Nequi](${SITE_URL}/nequi-pagos)
- [Rastrear Envío](${SITE_URL}/rastrear-envio)
- [Regalos Día de la Madre](${SITE_URL}/dia-de-la-madre)
- [Blog](${SITE_URL}/blog)
- [Contacto](${SITE_URL}/contacto)

## Información Detallada

Para una versión completa con catálogo de productos y precios actualizados, consulta:
- [llms-full.txt](${SITE_URL}/llms-full.txt)
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
