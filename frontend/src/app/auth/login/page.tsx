'use client';

/**
 * Página de Login Funcional - Sistema FEI
 * =======================================
 * 
 * Página de login que integra toda la infraestructura creada:
 * - useAuth hook para manejo de autenticación
 * - API client para comunicación con backend
 * - Tipos TypeScript completos
 * - UI/UX sistema de diseño (Fase 6.5)
 * - Validación de formularios
 * - Manejo de errores
 * - Redirección automática
 * 
 * Esta página demuestra que el sistema funciona end-to-end:
 * Frontend → API Client → Backend → JWT → Redirección
 * 
 * Archivo: app/auth/login/page.tsx
 * Autor: Sistema FEI - Fase 6.6 Día 8
 * Fecha: 17 Julio 2025
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import type { LoginCredentials } from '@/types/api-types';

// ===== COMPONENTES UI (usando el sistema de diseño existente) =====
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter,
  Button,
  Input,
  Label,
  Alert,
  LoadingSpinner,
  EyeIcon,
  EyeOffIcon,
  HorseIcon,
  TrophyIcon
} from '@/components/ui';

// ===== COMPONENTE PRINCIPAL =====
export default function LoginPage() {
  // Hooks
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();

  // Estado del formulario
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: ''
  });

  // Estado local
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Redireccionar si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Limpiar error cuando se cambie el formulario
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData, clearError]);

  // ===== HANDLERS =====

  /**
   * Manejar cambios en el formulario
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error de validación específico
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  /**
   * Validar formulario
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validar email
    if (!formData.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'El email no tiene un formato válido';
    }

    // Validar password
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 3) {
      errors.password = 'La contraseña debe tener al menos 3 caracteres';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulario
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🔐 Intentando login con:', { email: formData.email });
      
      const success = await login(formData);
      
      if (success) {
        console.log('✅ Login exitoso - redirigiendo...');
        // useAuth se encarga de la redirección automática
      } else {
        console.log('❌ Login falló');
        // El error ya está manejado por useAuth
      }
    } catch (error) {
      console.error('❌ Error inesperado en login:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Toggle mostrar contraseña
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // ===== HELPERS PARA DEMO =====
  
  /**
   * Llenar formulario con datos de demo
   */
  const fillDemoCredentials = (role: 'admin' | 'judge' | 'organizer') => {
    const demoCredentials = {
      admin: { email: 'admin@fei.com', password: 'admin123' },
      judge: { email: 'judge@fei.com', password: 'judge123' },
      organizer: { email: 'organizer@fei.com', password: 'org123' }
    };

    setFormData(demoCredentials[role]);
  };

  // Si ya está autenticado, mostrar loading
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="w-full max-w-md">
        {/* Header con logo/branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="p-3 bg-emerald-600 rounded-full">
              <HorseIcon className="h-8 w-8 text-white" />
            </div>
            <div className="p-3 bg-amber-500 rounded-full">
              <TrophyIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema FEI
          </h1>
          <p className="text-gray-600">
            Gestión de Competencias Ecuestres
          </p>
        </div>

        {/* Card de login */}
        <Card className="shadow-xl">
          <CardHeader>
            <h2 className="text-2xl font-bold text-center text-gray-900">
              Iniciar Sesión
            </h2>
            <p className="text-center text-gray-600">
              Accede a tu cuenta para continuar
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Mostrar error general */}
              {error && (
                <Alert variant="destructive">
                  <strong>Error de autenticación:</strong> {error}
                </Alert>
              )}

              {/* Campo Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  autoComplete="email"
                  disabled={isSubmitting || isLoading}
                  error={validationErrors.email}
                  className="w-full"
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-600">{validationErrors.email}</p>
                )}
              </div>

              {/* Campo Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    disabled={isSubmitting || isLoading}
                    error={validationErrors.password}
                    className="w-full pr-12"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={isSubmitting || isLoading}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-red-600">{validationErrors.password}</p>
                )}
              </div>

              {/* Demo credentials buttons */}
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">
                  O usa credenciales de demo:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fillDemoCredentials('admin')}
                    disabled={isSubmitting || isLoading}
                    className="text-xs"
                  >
                    Admin
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fillDemoCredentials('judge')}
                    disabled={isSubmitting || isLoading}
                    className="text-xs"
                  >
                    Juez
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fillDemoCredentials('organizer')}
                    disabled={isSubmitting || isLoading}
                    className="text-xs"
                  >
                    Organizador
                  </Button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="space-y-4">
              {/* Botón de submit */}
              <Button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>

              {/* Enlaces adicionales */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  ¿No tienes cuenta?{' '}
                  <Link 
                    href="/auth/register" 
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Regístrate aquí
                  </Link>
                </p>
                <p className="text-sm">
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 Sistema FEI. Gestión Profesional de Competencias Ecuestres.</p>
          <p className="mt-1">
            Desarrollado con ❤️ para la comunidad ecuestre
          </p>
        </div>
      </div>
    </div>
  );
}