// frontend/src/app/test-cards/page.tsx
'use client'

import { useState, Fragment } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { Trophy, Users, Calendar, TrendingUp, Award, Clock, Target, Zap, BarChart3, Star, CheckCircle, AlertCircle } from 'lucide-react'

// Componente Logo inline para evitar problemas
function LogoInline() {
  return (
    <div className="flex items-center">
      <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-equestrian-gold-400 to-equestrian-gold-600 flex items-center justify-center shadow-lg">
        <Trophy className="h-6 w-6 text-white" />
        <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-br from-equestrian-green-400 to-equestrian-green-500 rounded-full flex items-center justify-center">
          <Zap className="h-2.5 w-2.5 text-white" />
        </div>
      </div>
      <div className="ml-3">
        <div className="text-xl font-bold text-gray-900">
          Sistema <span className="text-transparent bg-clip-text bg-gradient-to-r from-equestrian-gold-500 to-equestrian-gold-600">FEI</span>
        </div>
        <div className="text-xs font-medium text-gray-500">
          Competencias Ecuestres
        </div>
      </div>
    </div>
  )
}

// Layout simplificado inline
function SimpleLayout({ children, title }: { children: React.ReactNode, title: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div>
      {/* Sidebar móvil simplificado */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                <div className="flex h-16 shrink-0 items-center">
                  <LogoInline />
                </div>
                <nav className="flex flex-1 flex-col">
                  <div className="space-y-2">
                    <div className="bg-gradient-to-r from-equestrian-gold-50 to-equestrian-gold-100 text-equestrian-gold-700 shadow-sm border border-equestrian-gold-200 group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold">
                      <Trophy className="h-6 w-6 text-equestrian-gold-600" />
                      Dashboard
                      <span className="ml-auto inline-flex items-center rounded-full bg-equestrian-gold-100 px-2.5 py-0.5 text-xs font-medium text-equestrian-gold-800">
                        Test
                      </span>
                    </div>
                  </div>
                </nav>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4 shadow-lg">
          <div className="flex h-16 shrink-0 items-center">
            <LogoInline />
          </div>
          <nav className="flex flex-1 flex-col">
            <div className="space-y-2">
              <div className="bg-gradient-to-r from-equestrian-gold-50 to-equestrian-gold-100 text-equestrian-gold-700 shadow-sm border border-equestrian-gold-200 group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-semibold">
                <Trophy className="h-6 w-6 text-equestrian-gold-600" />
                Dashboard Cards
                <span className="ml-auto inline-flex items-center rounded-full bg-equestrian-gold-100 px-2.5 py-0.5 text-xs font-medium text-equestrian-gold-800">
                  6.5.2.3
                </span>
              </div>
            </div>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        {/* Header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/10 bg-gradient-to-r from-equestrian-blue-600/90 via-equestrian-blue-700/90 to-indigo-700/90 backdrop-blur-xl px-4 shadow-lg sm:gap-x-6 sm:px-6 lg:px-8">
          <button type="button" className="-m-2.5 p-2.5 text-white/90 hover:text-white lg:hidden transition-colors" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Abrir sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="h-6 w-px bg-white/20 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                <h1 className="text-lg font-semibold leading-6 text-white">{title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">
              <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <span className="text-sm font-medium text-white">JP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Dashboard Cards inline
function DashboardCardsInline() {
  const metrics = [
    {
      title: 'Competencias Activas',
      value: '8',
      change: '+2 esta semana',
      icon: Trophy,
      gradient: 'bg-gradient-to-br from-equestrian-gold-400 to-equestrian-gold-600'
    },
    {
      title: 'Participantes Totales',
      value: '247',
      change: '+15 nuevos',
      icon: Users,
      gradient: 'bg-gradient-to-br from-equestrian-blue-400 to-equestrian-blue-600'
    },
    {
      title: 'Calificaciones Hoy',
      value: '34',
      change: '12 pendientes',
      icon: Target,
      gradient: 'bg-gradient-to-br from-equestrian-green-400 to-equestrian-green-600'
    },
    {
      title: 'Eventos Próximos',
      value: '5',
      change: 'Esta semana',
      icon: Calendar,
      gradient: 'bg-gradient-to-br from-purple-400 to-purple-600'
    }
  ];

  const quickActions = [
    {
      title: 'Nueva Competencia',
      description: 'Crear y configurar nuevo evento ecuestre',
      icon: Trophy,
      color: 'bg-gradient-to-br from-equestrian-gold-400 to-equestrian-gold-600',
      badge: 'Popular'
    },
    {
      title: 'Calificar Ahora',
      description: 'Acceso rápido al panel de calificación',
      icon: Zap,
      color: 'bg-gradient-to-br from-equestrian-green-400 to-equestrian-green-600',
      urgent: true
    },
    {
      title: 'Ver Rankings',
      description: 'Rankings en tiempo real de todas las categorías',
      icon: Award,
      color: 'bg-gradient-to-br from-equestrian-blue-400 to-equestrian-blue-600',
      badge: 'Live'
    },
    {
      title: 'Programar Evento',
      description: 'Gestionar calendario y horarios',
      icon: Clock,
      color: 'bg-gradient-to-br from-purple-400 to-purple-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Título */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 Dashboard Cards - Subfase 6.5.2.3</h1>
        <p className="text-gray-600">Métricas con iconos, gradientes y micro-interacciones</p>
      </div>

      {/* Métricas principales */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Métricas Principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.title} className="card group hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors mb-1">
                        {metric.title}
                      </p>
                    </div>
                    <div className={`h-12 w-12 rounded-xl ${metric.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-gray-900 group-hover:text-equestrian-blue-700 transition-colors">
                      {metric.value}
                    </p>
                    <div className="flex items-center space-x-1 text-equestrian-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm font-medium">{metric.change}</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-1 bg-gray-100">
                  <div className={`h-full ${metric.gradient} opacity-60 group-hover:opacity-80 transition-opacity duration-300`} 
                       style={{width: `${Math.random() * 40 + 60}%`}}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div key={action.title} className={`card group hover:shadow-premium hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden ${
                action.urgent ? 'ring-2 ring-equestrian-gold-300 ring-opacity-50' : ''
              }`}>
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`h-12 w-12 rounded-xl ${action.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 relative`}>
                      <Icon className="h-6 w-6 text-white" />
                      {action.urgent && (
                        <div className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-equestrian-blue-700 transition-colors truncate">
                          {action.title}
                        </h3>
                        {action.badge && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-equestrian-gold-100 px-2.5 py-0.5 text-xs font-medium text-equestrian-gold-800">
                            {action.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors mb-3">
                        {action.description}
                      </p>
                      <div className="flex items-center text-equestrian-blue-600 group-hover:text-equestrian-gold-600 transition-colors">
                        <span className="text-sm font-medium">Ir ahora</span>
                        <svg className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="h-1 bg-gray-100">
                  <div className={`h-full ${action.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resultado final */}
      <div className="card p-8 bg-gradient-to-r from-equestrian-gold-50 via-white to-equestrian-blue-50 border border-equestrian-gold-200 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          ✅ Subfase 6.5.2.3 - Dashboard Cards Completa
        </h3>
        <p className="text-gray-600 mb-4">
          Métricas visuales, hover effects, progress bars y micro-interacciones implementadas
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded-lg border">
            <strong>📊 Métricas:</strong> Con iconos y gradientes
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <strong>✨ Hover Effects:</strong> Elevación y escalado
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <strong>📈 Progress Bars:</strong> Animadas y responsive
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestCardsPage() {
  return (
    <SimpleLayout title="Dashboard Cards - Subfase 6.5.2.3">
      <DashboardCardsInline />
    </SimpleLayout>
  );
}