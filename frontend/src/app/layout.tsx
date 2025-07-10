// frontend/src/app/layout.tsx

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { OfflineWrapper } from '@/components/ui/OfflineWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sistema FEI de Competencias Ecuestres',
  description: 'Sistema de gestión de competencias ecuestres con calificación FEI en tiempo real',
  keywords: ['ecuestre', 'FEI', 'competencias', 'doma clásica', 'ranking'],
  authors: [{ name: 'Tu Equipo de Desarrollo' }],
  creator: 'Tu Organización',
  publisher: 'Tu Organización',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'FEI Ecuestre',
    'application-name': 'FEI Ecuestre',
    'msapplication-TileColor': '#3B82F6',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#3B82F6',
  },
};

export const viewport: Viewport = {
  themeColor: '#3B82F6',
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="background-color" content="#ffffff" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icon-167x167.png" />
        
        {/* Standard Icons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Microsoft Tiles */}
        <meta name="msapplication-TileImage" content="/icon-144x144.png" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        
        {/* Additional PWA Meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FEI Ecuestre" />
        
        {/* Prevent zoom on input focus (optional) */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        
        {/* CSS básico inline para offline */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html { 
              background-color: #ffffff !important; 
            }
            body { 
              background-color: #ffffff !important; 
              color: #000000 !important; 
              font-family: system-ui, -apple-system, sans-serif !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            /* Forzar estilos básicos de layout */
            .container { 
              max-width: 1200px !important; 
              margin: 0 auto !important; 
              padding: 1rem !important; 
            }
            .grid { 
              display: grid !important; 
            }
            .grid-cols-1 { 
              grid-template-columns: repeat(1, minmax(0, 1fr)) !important; 
            }
            .lg\\:grid-cols-3 { 
              grid-template-columns: repeat(1, minmax(0, 1fr)) !important; 
            }
            @media (min-width: 1024px) {
              .lg\\:grid-cols-3 { 
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important; 
              }
            }
            .gap-6 { 
              gap: 1.5rem !important; 
            }
            .bg-white { 
              background-color: #ffffff !important; 
            }
            .bg-gray-50 { 
              background-color: #f9fafb !important; 
            }
            .rounded-lg { 
              border-radius: 0.5rem !important; 
            }
            .shadow-md { 
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important; 
            }
            .p-6 { 
              padding: 1.5rem !important; 
            }
            .p-4 { 
              padding: 1rem !important; 
            }
            .mb-6 { 
              margin-bottom: 1.5rem !important; 
            }
            .mb-4 { 
              margin-bottom: 1rem !important; 
            }
            .space-y-4 > * + * { 
              margin-top: 1rem !important; 
            }
            .flex { 
              display: flex !important; 
            }
            .items-center { 
              align-items: center !important; 
            }
            .justify-between { 
              justify-content: space-between !important; 
            }
            .text-xl { 
              font-size: 1.25rem !important; 
            }
            .font-semibold { 
              font-weight: 600 !important; 
            }
            .border { 
              border-width: 1px !important; 
              border-color: #e5e7eb !important; 
            }
          `
        }} />
      </head>
      <body className={inter.className}>
        {/* Wrapper que contiene todos los componentes offline */}
        <OfflineWrapper>
          {children}
        </OfflineWrapper>
      </body>
    </html>
  );
}