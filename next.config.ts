import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    const rawBackend = process.env.BACKEND_API_URL || (process.env.NODE_ENV === 'production' ? 'https://backendapi.streamespn.org/api' : 'http://localhost:5000/api');
    const cleanBackend = rawBackend.replace(/\/$/, '');
    const backendDestination = cleanBackend.endsWith('/:path*') ? cleanBackend : `${cleanBackend}/:path*`;
    return [
      {
        source: '/api/:path*',
        destination: backendDestination,
      },
    ];
  },
};

export default nextConfig;
