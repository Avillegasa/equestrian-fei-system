// frontend/src/components/dashboard/DashboardCards.tsx
'use client'

import { Trophy, Users, Calendar, TrendingUp, Award, Clock, Target, Zap, BarChart3, Star, CheckCircle, AlertCircle } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ElementType
  gradient: string
  description?: string
}

function MetricCard({ title, value, change, changeType, icon: Icon, gradient, description }: MetricCardProps) {
  const changeColor = {
    positive: 'text-equestrian-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType || 'neutral']

  const changeIcon = {
    positive: TrendingUp,
    negative: TrendingUp,
    neutral: BarChart3
  }[changeType || 'neutral']

  const ChangeIcon = changeIcon

  return (
    <div className="card group hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors mb-1">
              {title}
            </p>
            {description && (
              <p className="text-xs text-gray-500 mb-2">{description}</p>
            )}
          </div>
          <div className={`h-12 w-12 rounded-xl ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-3xl font-bold text-gray-900 group-hover:text-equestrian-blue-700 transition-colors">
            {value}
          </p>
          {change && (
            <div className={`flex items-center space-x-1 ${changeColor}`}>
              <ChangeIcon className="h-4 w-4" />
              <span className="text-sm font-medium">{change}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress bar animada */}
      <div className="h-1 bg-gray-100">
        <div className={`h-full ${gradient} opacity-60 group-hover:opacity-80 transition-opacity duration-300`} 
             style={{width: `${Math.random() * 40 + 60}%`}}></div>
      </div>
    </div>
  )
}

interface QuickActionProps {
  title: string
  description: string
  icon: React.ElementType
  href: string
  color: string
  badge?: string
  urgent?: boolean
}

function QuickActionCard({ title, description, icon: Icon, href, color, badge, urgent }: QuickActionProps) {
  return (
    <a 
      href={href}
      className={`card group hover:shadow-premium hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden ${
        urgent ? 'ring-2 ring-equestrian-gold-300 ring-opacity-50' : ''
      }`}
    >
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 relative`}>
            <Icon className="h-6 w-6 text-white" />
            {urgent && (
              <div className="absolute -top-2 -right-2 h-4 w-4 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-equestrian-blue-700 transition-colors truncate">
                {title}
              </h3>
              {badge && (
                <span className="ml-2 inline-flex items-center rounded-full bg-equestrian-gold-100 px-2.5 py-0.5 text-xs font-medium text-equestrian-gold-800">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors mb-3">
              {description}
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
      
      {/* Hover effect line */}
      <div className="h-1 bg-gray-100">
        <div className={`h-full ${color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
      </div>
    </a>
  )
}

interface ActivityItemProps {
  icon: React.ElementType
  title: string
  description: string
  time: string
  type: 'success' | 'warning' | 'info' | 'neutral'
}

function ActivityItem({ icon: Icon, title, description, time, type }: ActivityItemProps) {
  const typeStyles = {
    success: 'bg-equestrian-green-100 text-equestrian-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    info: 'bg-equestrian-blue-100 text-equestrian-blue-600',
    neutral: 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`h-8 w-8 rounded-full ${typeStyles[type]} flex items-center justify-center flex-shrink-0`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  )
}

export default function DashboardCards() {
  const metrics = [
    {
      title: 'Competencias Activas',
      value: '8',
      change: '+2 esta semana',
      changeType: 'positive' as const,
      icon: Trophy,
      gradient: 'bg-gradient-to-br from-equestrian-gold-400 to-equestrian-gold-600',
      description: 'Eventos en curso'
    },
    {
      title: 'Participantes Totales',
      value: '247',
      change: '+15 nuevos',
      changeType: 'positive' as const,
      icon: Users,
      gradient: 'bg-gradient-to-br from-equestrian-blue-400 to-equestrian-blue-600',
      description: 'Jinetes registrados'
    },
    {
      title: 'Calificaciones Hoy',
      value: '34',
      change: '12 pendientes',
      changeType: 'neutral' as const,
      icon: Target,
      gradient: 'bg-gradient-to-br from-equestrian-green-400 to-equestrian-green-600',
      description: 'Ejercicios evaluados'
    },
    {
      title: 'Eventos Próximos',
      value: '5',
      change: 'Esta semana',
      changeType: 'neutral' as const,
      icon: Calendar,
      gradient: 'bg-gradient-to-br from-purple-400 to-purple-600',
      description: 'Programados'
    }
  ]

  const quickActions = [
    {
      title: 'Nueva Competencia',
      description: 'Crear y configurar nuevo evento ecuestre',
      icon: Trophy,
      href: '/competitions/new',
      color: 'bg-gradient-to-br from-equestrian-gold-400 to-equestrian-gold-600',
      badge: 'Popular'
    },
    {
      title: 'Calificar Ahora',
      description: 'Acceso rápido al panel de calificación',
      icon: Zap,
      href: '/scoring',
      color: 'bg-gradient-to-br from-equestrian-green-400 to-equestrian-green-600',
      urgent: true
    },
    {
      title: 'Ver Rankings',
      description: 'Rankings en tiempo real de todas las categorías',
      icon: Award,
      href: '/rankings',
      color: 'bg-gradient-to-br from-equestrian-blue-400 to-equestrian-blue-600',
      badge: 'Live'
    },
    {
      title: 'Programar Evento',
      description: 'Gestionar calendario y horarios',
      icon: Clock,
      href: '/schedule',
      color: 'bg-gradient-to-br from-purple-400 to-purple-600'
    }
  ]

  const recentActivity = [
    {
      icon: CheckCircle,
      title: 'Calificación completada',
      description: 'María González - Dressage Intermedio',
      time: 'Hace 5 minutos',
      type: 'success' as const
    },
    {
      icon: AlertCircle,
      title: 'Puntuación pendiente',
      description: 'Carlos Ruiz requiere justificación',
      time: 'Hace 12 minutos',
      type: 'warning' as const
    },
    {
      icon: Star,
      title: 'Nuevo participante',
      description: 'Ana Martín se registró en Nivel Avanzado',
      time: 'Hace 1 hora',
      type: 'info' as const
    },
    {
      icon: Trophy,
      title: 'Ranking actualizado',
      description: 'Cambios en categoría Young Riders',
      time: 'Hace 2 horas',
      type: 'neutral' as const
    }
  ]

  return (
    <div className="space-y-8">
      
      {/* Título principal */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard de Competencias
        </h1>
        <p className="text-gray-600">
          Panel de control con métricas y acciones rápidas
        </p>
      </div>

      {/* Métricas principales */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">📊 Métricas Principales</h2>
          <button className="text-equestrian-blue-600 hover:text-equestrian-blue-700 text-sm font-medium">
            Ver todas →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">🚀 Acciones Rápidas</h2>
          <span className="text-sm text-gray-500">Click para acceder</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action) => (
            <QuickActionCard key={action.title} {...action} />
          ))}
        </div>
      </div>

      {/* Actividad reciente */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">📈 Actividad Reciente</h2>
          <button className="text-equestrian-blue-600 hover:text-equestrian-blue-700 text-sm font-medium">
            Ver historial →
          </button>
        </div>
        <div className="card p-6">
          <div className="space-y-1">
            {recentActivity.map((activity, index) => (
              <ActivityItem key={index} {...activity} />
            ))}
          </div>
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso Semanal</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Calificaciones</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="progress-container">
                <div className="progress-bar bg-gradient-to-r from-equestrian-green-400 to-equestrian-green-600" style={{width: '85%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Participación</span>
                <span className="font-medium">92%</span>
              </div>
              <div className="progress-container">
                <div className="progress-bar bg-gradient-to-r from-equestrian-blue-400 to-equestrian-blue-600" style={{width: '92%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Eventos</span>
                <span className="font-medium">78%</span>
              </div>
              <div className="progress-container">
                <div className="progress-bar bg-gradient-to-r from-equestrian-gold-400 to-equestrian-gold-600" style={{width: '78%'}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Participantes</h3>
          <div className="space-y-3">
            {[
              { name: 'María González', score: '9.2', position: 1 },
              { name: 'Carlos Ruiz', score: '8.8', position: 2 },
              { name: 'Ana Martín', score: '8.5', position: 3 }
            ].map((participant) => (
              <div key={participant.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    participant.position === 1 ? 'bg-equestrian-gold-500' :
                    participant.position === 2 ? 'bg-gray-400' :
                    'bg-yellow-600'
                  }`}>
                    {participant.position}
                  </div>
                  <span className="font-medium text-gray-900">{participant.name}</span>
                </div>
                <span className="font-mono font-bold text-equestrian-blue-600">{participant.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Sistema</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Servidor</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-equestrian-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-equestrian-green-600">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Base de Datos</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-equestrian-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-equestrian-green-600">Activa</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sincronización</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-yellow-600">Sync...</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Backup</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-equestrian-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-600">4:32 AM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to action final */}
      <div className="card p-8 bg-gradient-to-r from-equestrian-gold-50 via-white to-equestrian-blue-50 border border-equestrian-gold-200 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🎯 Subfase 6.5.2.3 Completada
        </h3>
        <p className="text-gray-600 mb-4">
          Dashboard Cards con métricas visuales, hover effects y micro-interacciones implementadas
        </p>
        <div className="flex justify-center space-x-4">
          <button className="btn btn-primary">
            ✅ Marcar como Completa
          </button>
          <button className="btn btn-secondary">
            🚀 Proceder a 6.5.3
          </button>
        </div>
      </div>

    </div>
  )
}