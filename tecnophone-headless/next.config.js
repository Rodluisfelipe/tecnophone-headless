/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [384, 640, 750, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wp.tecnophone.co',
      },
      {
        protocol: 'https',
        hostname: 'www.tecnophone.co',
      },
      {
        protocol: 'https',
        hostname: 'tecnophone.co',
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'algoliasearch', 'zustand'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://http2.mlstatic.com",
              "style-src 'self' 'unsafe-inline' https://http2.mlstatic.com https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://wp.tecnophone.co https://www.tecnophone.co https://tecnophone.co https://http2.mlstatic.com https://*.mercadolibre.com",
              "font-src 'self' https://fonts.gstatic.com https://http2.mlstatic.com",
              "connect-src 'self' https://wp.tecnophone.co https://www.tecnophone.co https://tecnophone.co https://api.mercadopago.com https://events.mercadopago.com https://api.groq.com https://*.algolia.net https://*.algolianet.com",
              "frame-src 'self' https://sdk.mercadopago.com https://www.mercadopago.com https://www.mercadopago.com.co",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/(.*)\\.(js|css|woff2|avif|webp|svg)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // WordPress core paths
      { source: '/wp-admin/:path*', destination: '/', permanent: true },
      { source: '/wp-login.php', destination: '/', permanent: true },
      { source: '/wp-content/:path*', destination: '/', permanent: true },
      { source: '/wp-includes/:path*', destination: '/', permanent: true },
      { source: '/wp-json/:path*', destination: '/', permanent: false },
      { source: '/xmlrpc.php', destination: '/', permanent: true },
      { source: '/wp-cron.php', destination: '/', permanent: true },
      { source: '/wp-signup.php', destination: '/', permanent: true },
      // WooCommerce old paths
      { source: '/tienda', destination: '/productos', permanent: true },
      { source: '/tienda/:path*', destination: '/productos', permanent: true },
      { source: '/shop', destination: '/productos', permanent: true },
      { source: '/shop/:path*', destination: '/productos', permanent: true },
      { source: '/carrito', destination: '/', permanent: true },
      { source: '/cart', destination: '/', permanent: true },
      { source: '/mi-cuenta', destination: '/', permanent: true },
      { source: '/mi-cuenta/:path*', destination: '/', permanent: true },
      { source: '/my-account', destination: '/', permanent: true },
      { source: '/my-account/:path*', destination: '/', permanent: true },
      { source: '/finalizar-compra', destination: '/checkout', permanent: true },
      // WooCommerce product category old patterns
      { source: '/product-category/:slug*', destination: '/categorias', permanent: true },
      { source: '/categoria-producto/:slug*', destination: '/categorias', permanent: true },
      // WooCommerce single product old pattern
      { source: '/product/:slug', destination: '/producto/:slug', permanent: true },
      // WordPress feeds
      { source: '/feed', destination: '/', permanent: true },
      { source: '/feed/:path*', destination: '/', permanent: true },
      { source: '/comments/feed', destination: '/', permanent: true },
      // WordPress date-based archives
      { source: '/2020/:path*', destination: '/', permanent: true },
      { source: '/2021/:path*', destination: '/', permanent: true },
      { source: '/2022/:path*', destination: '/', permanent: true },
      { source: '/2023/:path*', destination: '/', permanent: true },
      { source: '/2024/:path*', destination: '/', permanent: true },
      { source: '/2025/:path*', destination: '/', permanent: true },
      { source: '/2026/:path*', destination: '/', permanent: true },
      // WordPress taxonomy pages
      { source: '/category/:path*', destination: '/', permanent: true },
      { source: '/tag/:path*', destination: '/', permanent: true },
      { source: '/author/:path*', destination: '/', permanent: true },
      // WordPress pagination
      { source: '/page/:path*', destination: '/', permanent: true },
      // WordPress search
      { source: '/search/:path*', destination: '/buscar', permanent: true },
      // Common WordPress pages
      { source: '/sample-page', destination: '/', permanent: true },
      { source: '/hello-world', destination: '/', permanent: true },
      { source: '/politica-de-privacidad', destination: '/', permanent: true },
      { source: '/privacy-policy', destination: '/', permanent: true },
      { source: '/terms-and-conditions', destination: '/', permanent: true },
      // Legacy attachment pages
      { source: '/attachment/:path*', destination: '/', permanent: true },
    ];
  },
};

module.exports = nextConfig;
