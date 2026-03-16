/** @type {import('next').NextConfig} */
const meilisearchHost = process.env.NEXT_PUBLIC_MEILISEARCH_HOST || 'http://127.0.0.1:7700';

const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [384, 640, 750, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000,
    remotePatterns: [
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
    optimizePackageImports: ['lucide-react'],
    optimizeCss: true,
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
              "img-src 'self' data: blob: https://www.tecnophone.co https://tecnophone.co https://http2.mlstatic.com https://*.mercadolibre.com",
              "font-src 'self' https://fonts.gstatic.com https://http2.mlstatic.com",
              "connect-src 'self' https://www.tecnophone.co https://tecnophone.co https://api.mercadopago.com https://events.mercadopago.com https://api.groq.com " + meilisearchHost,
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
};

module.exports = nextConfig;
