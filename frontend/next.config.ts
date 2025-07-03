import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  // Configuración para desarrollo
  typescript: {
    // Ignorar errores de TypeScript durante el build (solo para desarrollo inicial)
    ignoreBuildErrors: false,
  },
  eslint: {
    // Ignorar errores de ESLint durante el build (solo para desarrollo inicial)
    ignoreDuringBuilds: false,
  },
  // Configuración para APIs externas
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ]
  },
}

export default nextConfig