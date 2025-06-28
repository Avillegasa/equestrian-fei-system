import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
    WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000',
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000', 
        pathname: '/media/**',
      },
    ],
  },

  // ELIMINAR ESTE BLOQUE COMPLETO:
  // async rewrites() { ... },

  serverExternalPackages: ['socket.io-client'],

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;