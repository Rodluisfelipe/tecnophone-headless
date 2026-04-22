import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware that catches old WordPress URLs not handled by next.config.js
 * redirects and sends them to the homepage with a 301.
 *
 * Known valid paths are whitelisted — everything else redirects.
 */

const VALID_PREFIXES = [
  '/',          // exact homepage
  '/producto/', // product detail
  '/productos',
  '/categoria/',
  '/categorias',
  '/checkout',
  '/buscar',
  '/contacto',
  '/empresas',
  '/dolar-hoy',
  '/salario-minimo',
  '/partidos',
  '/dia-de-la-madre',
  '/rastrear-envio',
  '/nequi-pagos',
  '/terminos-condiciones',
  '/politica-privacidad',
  '/politica-envios',
  '/derecho-retracto',
  '/blog',
  '/api/',
  '/_next/',
  '/icons/',
  '/manifest.json',
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
  '/llms-full.txt',
];

// Static file extensions — never redirect these
const STATIC_EXT = /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|json|xml|txt|map)$/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // Enforce www subdomain (non-www → www) for production
  if (host === 'tecnophone.co') {
    const url = request.nextUrl.clone();
    url.host = 'www.tecnophone.co';
    return NextResponse.redirect(url, 301);
  }

  // Never redirect static assets
  if (STATIC_EXT.test(pathname)) return NextResponse.next();

  // Allow exact homepage
  if (pathname === '/') return NextResponse.next();

  // Allow known valid prefixes
  for (const prefix of VALID_PREFIXES) {
    if (prefix === '/') continue; // already handled above
    if (pathname === prefix || pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  // Everything else → redirect to homepage (302 — temporary, not cached by browsers)
  const url = request.nextUrl.clone();
  url.pathname = '/';
  url.search = '';
  return NextResponse.redirect(url, 302);
}

export const config = {
  // Run on all paths except Next.js internals and static files
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.png|icons/).*)',
  ],
};
