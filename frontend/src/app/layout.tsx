/**
 * Layout Principal - Sistema FEI
 * ==============================
 * 
 * Layout raíz de la aplicación Next.js que:
 * - Configura metadatos SEO
 * - Envuelve toda la app con AuthProvider
 * - Configura fuentes y estilos globales
 * - Optimiza para rendimiento
 * 
 * Archivo: frontend/src/app/layout.tsx
 * Autor: Sistema FEI - Fase 6.6 Día 9
 * Fecha: 17 Julio 2025
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

// ===== CONFIGURACIÓN DE FUENTES =====
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

// ===== METADATOS SEO =====
export const metadata: Metadata = {
  title: {
    default: 'Sistema FEI - Gestión de Competencias Ecuestres',
    template: '%s | Sistema FEI'
  },
  description: 'Sistema profesional para gestión de competencias ecuestres con calificación FEI, rankings en tiempo real y administración completa.',
  keywords: [
    'FEI',
    'competencias ecuestres', 
    'doma clásica',
    'salto ecuestre',
    'rankings',
    'calificación deportiva',
    'gestión de eventos',
    'deportes ecuestres'
  ],
  authors: [{ name: 'Sistema FEI Team' }],
  creator: 'Sistema FEI',
  publisher: 'Sistema FEI',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: 'Sistema FEI',
    title: 'Sistema FEI - Gestión de Competencias Ecuestres',
    description: 'Sistema profesional para gestión de competencias ecuestres con calificación FEI y rankings en tiempo real.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Sistema FEI - Gestión de Competencias Ecuestres',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sistema FEI - Gestión de Competencias Ecuestres',
    description: 'Sistema profesional para gestión de competencias ecuestres con calificación FEI y rankings en tiempo real.',
    images: ['/og-image.jpg'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#0f172a' },
    ],
  },
  manifest: '/site.webmanifest',
  other: {
    'msapplication-TileColor': '#0f172a',
    'theme-color': '#ffffff',
  },
};

// ===== COMPONENTE LAYOUT PRINCIPAL =====
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <head>
        {/* Preconnect para optimización de rendimiento */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch para APIs externas */}
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'} />
        
        {/* Meta tags adicionales para PWA */}
        <meta name="application-name" content="Sistema FEI" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sistema FEI" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Security headers */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' ws: wss:;" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900`}>
        {/* Envolver toda la aplicación con AuthProvider */}
        <AuthProvider>
          {/* Loading spinner global para primera carga */}
          <div id="global-loading" className="fixed inset-0 z-50 bg-white flex items-center justify-center" style={{ display: 'none' }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando Sistema FEI...</p>
            </div>
          </div>
          
          {/* Contenido principal de la aplicación */}
          <main id="main-content" className="min-h-screen">
            {children}
          </main>
          
          {/* Toast container para notificaciones globales */}
          <div id="toast-container" className="fixed top-4 right-4 z-50 space-y-2" aria-live="polite" aria-label="Notificaciones">
            {/* Los toasts se insertan aquí dinámicamente */}
          </div>
        </AuthProvider>
        
        {/* Scripts de inicialización */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Ocultar loading spinner después de que React hidrate
              window.addEventListener('DOMContentLoaded', function() {
                const loadingEl = document.getElementById('global-loading');
                if (loadingEl) {
                  setTimeout(() => {
                    loadingEl.style.display = 'none';
                  }, 100);
                }
              });
              
              // Configurar modo oscuro si está soportado
              if (typeof Storage !== 'undefined') {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              }
              
              // Configurar service worker para PWA
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('SW registered: ', registration);
                  }).catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}