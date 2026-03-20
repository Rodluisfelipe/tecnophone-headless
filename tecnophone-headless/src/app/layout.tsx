import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import dynamic from 'next/dynamic';
import './globals.css';
import Footer from '@/components/layout/Footer';

const Navbar = dynamic(() => import('@/components/layout/Navbar'), {
  loading: () => (
    <header className="sticky top-0 z-50">
      <div className="bg-primary-600 text-white py-1.5 text-center">
        <div className="container-custom">
          <div className="text-xs sm:text-sm font-semibold h-5" />
        </div>
      </div>
      <nav className="border-b border-surface-200 bg-white/80 backdrop-blur-md">
        <div className="container-custom">
          <div className="h-16 lg:h-[68px]" />
        </div>
      </nav>
    </header>
  ),
});
const CartDrawer = dynamic(() => import('@/components/layout/CartDrawer'), { ssr: false });

const ToasterProvider = dynamic(() => import('@/components/layout/ToasterProvider'), { ssr: false });
const BottomNav = dynamic(() => import('@/components/layout/BottomNav'), { ssr: false });
const AiChatBubble = dynamic(() => import('@/components/chat/AiChatBubble'), {
  ssr: false,
  loading: () => null,
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tecnophone.co'
  ),
  title: {
    default: 'TecnoPhone - Tecnología al Mejor Precio | Portátiles, Celulares, Accesorios',
    template: '%s | TecnoPhone',
  },
  description:
    'Tienda de tecnología en Colombia. Portátiles, celulares, tablets, monitores, impresoras y accesorios de las mejores marcas. Envíos a todo el país.',
  keywords: [
    'tecnología Colombia',
    'portátiles',
    'computadores',
    'celulares',
    'tablets',
    'monitores',
    'accesorios',
    'TecnoPhone',
    'Chía',
    'tienda tecnología',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    siteName: 'TecnoPhone',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TecnoPhone" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="preconnect" href="https://wp.tecnophone.co" />
        <link rel="dns-prefetch" href="https://wp.tecnophone.co" />
      </head>
      <body className="min-h-screen flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold focus:shadow-lg"
        >
          Ir al contenido principal
        </a>
        <Navbar />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />

        <BottomNav />
        <AiChatBubble />
        <ToasterProvider />
      </body>
    </html>
  );
}
