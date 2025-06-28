@echo off
echo 🚀 Configurando Frontend para FASE 2: Gestión de Usuarios y Autenticación...
echo.

REM Ir al directorio frontend
cd frontend

echo 📦 Instalando dependencias adicionales para Fase 2...
npm install @headlessui/react @heroicons/react clsx

echo 📁 Creando estructura de directorios...
mkdir src\types 2>nul
mkdir src\lib 2>nul
mkdir src\contexts 2>nul
mkdir src\components\layout 2>nul
mkdir src\components\dashboard 2>nul
mkdir src\app\auth\login 2>nul
mkdir src\app\auth\register 2>nul
mkdir src\app\dashboard 2>nul
mkdir src\app\profile 2>nul

echo 📄 Creando archivos de configuración...

REM Crear archivo de variables de entorno
echo NEXT_PUBLIC_API_URL=http://localhost:8000/api > .env.local

REM Crear archivo de configuración TypeScript
echo {
echo   "compilerOptions": {
echo     "target": "es5",
echo     "lib": ["dom", "dom.iterable", "es6"],
echo     "allowJs": true,
echo     "skipLibCheck": true,
echo     "strict": true,
echo     "forceConsistentCasingInFileNames": true,
echo     "noEmit": true,
echo     "esModuleInterop": true,
echo     "module": "esnext",
echo     "moduleResolution": "bundler",
echo     "resolveJsonModule": true,
echo     "isolatedModules": true,
echo     "jsx": "preserve",
echo     "incremental": true,
echo     "plugins": [
echo       {
echo         "name": "next"
echo       }
echo     ],
echo     "baseUrl": ".",
echo     "paths": {
echo       "@/*": ["./src/*"]
echo     }
echo   },
echo   "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
echo   "exclude": ["node_modules"]
echo } > tsconfig.json

REM Crear configuración de Tailwind CSS básica
echo import type { Config } from 'tailwindcss';
echo.
echo const config: Config = {
echo   content: [
echo     './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
echo     './src/components/**/*.{js,ts,jsx,tsx,mdx}',
echo     './src/app/**/*.{js,ts,jsx,tsx,mdx}',
echo   ],
echo   theme: {
echo     extend: {
echo       colors: {
echo         primary: {
echo           50: '#eff6ff',
echo           100: '#dbeafe',
echo           200: '#bfdbfe',
echo           300: '#93c5fd',
echo           400: '#60a5fa',
echo           500: '#3b82f6',
echo           600: '#2563eb',
echo           700: '#1d4ed8',
echo           800: '#1e40af',
echo           900: '#1e3a8a',
echo         },
echo       },
echo     },
echo   },
echo   plugins: [],
echo } satisfies Config;
echo.
echo export default config; > tailwind.config.ts

echo 🔧 Configurando estructura de aplicación Next.js...

REM Crear layout principal
echo import type { Metadata } from 'next';
echo import { Inter } from 'next/font/google';
echo import { AuthProvider } from '@/contexts/AuthContext';
echo import './globals.css';
echo.
echo const inter = Inter({ subsets: ['latin'] });
echo.
echo export const metadata: Metadata = {
echo   title: 'Sistema FEI - Gestión de Competencias Ecuestres',
echo   description: 'Sistema de gestión de competencias ecuestres según estándares FEI',
echo };
echo.
echo export default function RootLayout({
echo   children,
echo }: {
echo   children: React.ReactNode;
echo }) {
echo   return (
echo     ^<html lang="es"^>
echo       ^<body className={inter.className}^>
echo         ^<AuthProvider^>
echo           {children}
echo         ^</AuthProvider^>
echo       ^</body^>
echo     ^</html^>
echo   );
echo } > src\app\layout.tsx

REM Crear página principal que redirecciona al dashboard
echo 'use client';
echo.
echo import { useEffect } from 'react';
echo import { useAuth } from '@/contexts/AuthContext';
echo.
echo export default function HomePage() {
echo   const { isAuthenticated, isLoading } = useAuth();
echo.
echo   useEffect(() => {
echo     if (!isLoading) {
echo       if (isAuthenticated) {
echo         window.location.href = '/dashboard';
echo       } else {
echo         window.location.href = '/auth/login';
echo       }
echo     }
echo   }, [isAuthenticated, isLoading]);
echo.
echo   if (isLoading) {
echo     return (
echo       ^<div className="min-h-screen flex items-center justify-center bg-gray-50"^>
echo         ^<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"^>^</div^>
echo       ^</div^>
echo     );
echo   }
echo.
echo   return null;
echo } > src\app\page.tsx

REM Crear archivo CSS global básico
echo @tailwind base;
echo @tailwind components;
echo @tailwind utilities;
echo.
echo @layer base {
echo   html {
echo     font-family: system-ui, sans-serif;
echo   }
echo }
echo.
echo @layer components {
echo   .btn-primary {
echo     @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors;
echo   }
echo   
echo   .btn-secondary {
echo     @apply bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-md transition-colors;
echo   }
echo } > src\app\globals.css

cd ..

echo ✅ Frontend configurado para Fase 2!
echo.
echo 📋 Estructura creada:
echo    ✅ Dependencias de UI instaladas (@headlessui/react, @heroicons/react)
echo    ✅ Configuración de TypeScript
echo    ✅ Configuración de Tailwind CSS
echo    ✅ Estructura de directorios para autenticación
echo    ✅ Layout principal con AuthProvider
echo    ✅ Variables de entorno configuradas
echo.
echo 🔄 Próximos pasos:
echo    1. Los archivos de componentes React se crearán en la implementación
echo    2. Ejecutar: cd frontend ^&^& npm run dev
echo    3. El frontend estará disponible en http://localhost:3000
echo.
echo 💡 Para desarrollo:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:8000/api
echo    - Admin Django: http://localhost:8000/admin
echo.
pause