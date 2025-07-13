// frontend/src/app/test-layout/page.tsx
'use client'

import DashboardLayoutNoAuth from '@/components/layout/DashboardLayoutNoAuth'

// Usuario mock para pruebas
const mockUser = {
  id: 1,
  first_name: 'Juan',
  last_name: 'Pérez',
  full_name: 'Juan Pérez',
  email: 'juan@test.com',
  role: 'ADMIN' as const,
  is_staff: true,
  is_active: true
}

export default function TestLayoutPage() {
  return (
    <DashboardLayoutNoAuth user={mockUser} title="Prueba de Subfase 6.5.2">
      <div className="space-y-8">
        
        {/* Header de la prueba */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Prueba de Navegación Renovada
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Verificación de Header, Logo y Sidebar con iconos temáticos
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Subfase 6.5.2 en Prueba
          </div>
        </div>

        {/* Grid de verificaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Header Check */}
          <div className="card p-6 hover:shadow-premium hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-equestrian-blue-400 to-equestrian-blue-600 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Header Renovado</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>🔵 Gradiente azul con glassmorphism</li>
              <li>⚪ Avatar con bordes suaves</li>
              <li>🟢 Indicador de estado animado</li>
              <li>🔔 Icono de notificaciones</li>
            </ul>
          </div>

          {/* Logo Check */}
          <div className="card p-6 hover:shadow-premium hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-equestrian-gold-400 to-equestrian-gold-600 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Logo Ecuestre</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>🏆 Trofeo dorado principal</li>
              <li>⚡ Rayo verde en esquina</li>
              <li>📝 Texto "Sistema FEI" con gradiente</li>
              <li>🎯 Subtítulo descriptivo</li>
            </ul>
          </div>

          {/* Navigation Check */}
          <div className="card p-6 hover:shadow-premium hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-equestrian-green-400 to-equestrian-green-600 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Navegación</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>🎯 Iconos temáticos (Trophy, Users, etc.)</li>
              <li>🟡 Estados activos en dorado</li>
              <li>📦 Badge "3" en Competencias</li>
              <li>✨ Hover effects suaves</li>
            </ul>
          </div>

          {/* Responsive Check */}
          <div className="card p-6 hover:shadow-premium hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Responsive</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>💻 Desktop: Sidebar fijo visible</li>
              <li>📱 Mobile: Hamburguesa + overlay</li>
              <li>🎭 Animaciones de transición</li>
              <li>👆 Touch-friendly en tablets</li>
            </ul>
          </div>

          {/* Colors Check */}
          <div className="card p-6 hover:shadow-premium hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4 4 4 0 004-4V5z" />
                </svg>
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Colores</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>🟡 Oro ecuestre (#D4AF37)</li>
              <li>🔵 Azul noble (#1E3A8A)</li>
              <li>🟢 Verde competencia (#059669)</li>
              <li>🎨 Gradientes y sombras suaves</li>
            </ul>
          </div>

          {/* Interactions Check */}
          <div className="card p-6 hover:shadow-premium hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Interacciones</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>🎯 Micro-animaciones suaves</li>
              <li>🔄 Transiciones de 200ms</li>
              <li>📈 Hover: elevación y escalado</li>
              <li>💫 Estados de focus visibles</li>
            </ul>
          </div>

        </div>

        {/* Checklist final */}
        <div className="card p-8 bg-gradient-to-r from-equestrian-gold-50 via-white to-equestrian-blue-50 border border-equestrian-gold-200">
          <h2 className="text-2xl font-bold mb-6 text-center">📋 Checklist de Verificación Final</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-equestrian-blue-700">🖥️ Desktop</h3>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span>Sidebar izquierdo visible</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span>Header azul con gradiente</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span>Logo ecuestre funcional</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span>Iconos temáticos visibles</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-equestrian-blue-700">📱 Mobile</h3>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                  <span>Reducir ventana &lt; 1024px</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                  <span>Sidebar debe ocultarse</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                  <span>Botón hamburguesa visible</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-yellow-500"></div>
                  <span>Click abre sidebar overlay</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 bg-equestrian-gold-100 rounded-lg border border-equestrian-gold-300">
            <p className="text-center text-equestrian-gold-800 font-medium">
              🎯 <strong>Objetivo:</strong> Verificar que todos los elementos visuales de la Subfase 6.5.2 funcionan correctamente
            </p>
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-center space-x-4">
          <a 
            href="/test-design" 
            className="btn btn-secondary"
          >
            🎨 Ver Sistema de Diseño
          </a>
          <a 
            href="/" 
            className="btn btn-primary"
          >
            🏠 Volver al Inicio
          </a>
        </div>

      </div>
    </DashboardLayoutNoAuth>
  )
}