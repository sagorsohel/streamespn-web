import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'r2.thesportsdb.com',
      },
      {
        protocol: 'https',
        hostname: 'www.thesportsdb.com',
      },
      {
        protocol: 'https',
        hostname: 'thesportsdb.com',
      },
      {
        protocol: 'https',
        hostname: '**.thesportsdb.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  allowedDevOrigins: [
    '*.lhr.life',
    '*.ngrok-free.app',
    '*.ngrok-free.dev',
    '*.loca.lt',
    'localhost:3000',
    '127.0.0.1:3000',
    '192.168.0.104',
    '192.168.0.*',
    '192.168.1.*',
    '10.0.0.*'
  ],
  async rewrites() {
    const rawBackend =
      process.env.BACKEND_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'http://127.0.0.1:5001/api'
        : 'http://localhost:5001/api');
    const cleanBackend = rawBackend.replace(/\/$/, '');
    const backendDestination = cleanBackend.endsWith('/:path*') ? cleanBackend : `${cleanBackend}/:path*`;
    return [
      {
        source: '/api/:path*',
        destination: backendDestination,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2|ttf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
