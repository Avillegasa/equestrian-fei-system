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

  async rewrites() {
    // Usar la URL directa en lugar de variable de entorno
    const apiUrl = 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },

  // Configuración específica para el sistema ecuestre
  // Actualizar la configuración experimental según las nuevas versiones de Next.js
  serverExternalPackages: ['socket.io-client'],

  // Optimizaciones para PWA (funcionalidad offline)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Headers de seguridad
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