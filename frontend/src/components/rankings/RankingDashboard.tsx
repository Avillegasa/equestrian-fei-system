import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Users, 
  Trophy, 
  Clock, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Signal,
  Database,
  Server,
  Cpu,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  Settings
} from 'lucide-react';
import { 
  useRankings, 
  useSystemMetrics, 
  useRankingNotifications,
  useRankingStats
} from '@/hooks/useRankings';
import { LiveRankingDisplay } from './LiveRankingDisplay';

interface RankingDashboardProps {
  competitionId?: string;
  categoryId?: string;
}

export function RankingDashboard({ competitionId, categoryId }: RankingDashboardProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'live' | 'metrics' | 'notifications'>('overview');
  const [selectedCompetition, setSelectedCompetition] = useState(competitionId || '');
  const [selectedCategory, setSelectedCategory] = useState(categoryId || '');
  const [dateRange, setDateRange] = useState('today');

  const { rankings, isLoading: rankingsLoading, refetch: refetchRankings } = useRankings({
    competition_id: selectedCompetition,
    category_id: selectedCategory,
    is_current: true
  });

  const { data: systemMetrics, isLoading: metricsLoading } = useSystemMetrics();
  const { notifications, unreadCount } = useRankingNotifications();
  
  const { data: stats, isLoading: statsLoading } = useRankingStats(
    selectedCompetition, 
    selectedCategory
  );

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      refetchRankings();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchRankings]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertCircle className="w-5 h-5" />;
      case 'error': return <XCircle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Métricas del sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <RankingMetricsCard
          title="Competencias Activas"
          value={systemMetrics?.active_competitions || 0}
          icon={<Trophy className="w-6 h-6" />}
          color="blue"
          loading={metricsLoading}
        />
        <RankingMetricsCard
          title="Participantes Total"
          value={systemMetrics?.total_participants || 0}
          icon={<Users className="w-6 h-6" />}
          color="green"
          loading={metricsLoading}
        />
        <RankingMetricsCard
          title="Cálculos Hoy"
          value={systemMetrics?.calculations_today || 0}
          icon={<Activity className="w-6 h-6" />}
          color="purple"
          loading={metricsLoading}
        />
        <RankingMetricsCard
          title="Tiempo Promedio"
          value={systemMetrics?.average_calculation_time || 0}
          unit="ms"
          icon={<Clock className="w-6 h-6" />}
          color="orange"
          loading={metricsLoading}
        />
      </div>

      {/* Estado del sistema */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Estado del Sistema</h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">En línea</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Database className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Base de Datos</p>
              <p className="text-xs text-gray-600">Conectada</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Server className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Redis Cache</p>
              <p className="text-xs text-gray-600">
                {systemMetrics?.cache_hit_rate?.toFixed(1) || 0}% hit rate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Signal className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium">WebSockets</p>
              <p className="text-xs text-gray-600">
                {systemMetrics?.websocket_connections || 0} conexiones
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rankings activos */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Rankings Activos</h3>
          <button
            onClick={() => refetchRankings()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={rankingsLoading}
          >
            <RefreshCw className={`w-5 h-5 ${rankingsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {rankingsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {rankings.map((ranking) => (
              <motion.div
                key={ranking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{ranking.competition_name}</h4>
                    <p className="text-sm text-gray-600">{ranking.category_name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{ranking.total_participants} participantes</p>
                      <p className="text-xs text-gray-600">
                        {ranking.progress_percentage.toFixed(1)}% completado
                      </p>
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${ranking.progress_percentage}%` }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCompetition(ranking.competition);
                        setSelectedCategory(ranking.category);
                        setSelectedView('live');
                      }}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Ver en vivo
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Notificaciones recientes */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Notificaciones Recientes</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="space-y-3">
          {notifications.slice(0, 5).map((notification) => (
            <div key={notification.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`mt-1 ${getStatusColor(notification.type)}`}>
                {getStatusIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLiveView = () => (
    <div className="space-y-6">
      {/* Selector de competencia */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Ranking en Vivo</h3>
          <div className="flex items-center gap-4">
            <select
              value={selectedCompetition}
              onChange={(e) => setSelectedCompetition(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar competencia</option>
              {rankings.map((ranking) => (
                <option key={ranking.id} value={ranking.competition}>
                  {ranking.competition_name}
                </option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!selectedCompetition}
            >
              <option value="">Seleccionar categoría</option>
              {rankings
                .filter(r => r.competition === selectedCompetition)
                .map((ranking) => (
                  <option key={ranking.id} value={ranking.category}>
                    {ranking.category_name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        
        {selectedCompetition && selectedCategory && (
          <LiveRankingDisplay
            competitionId={selectedCompetition}
            categoryId={selectedCategory}
            showControls={true}
            maxEntries={50}
          />
        )}
      </div>
    </div>
  );

  const renderMetrics = () => (
    <div className="space-y-6">
      {/* Métricas detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Rendimiento</h3>
            <Cpu className="w-6 h-6 text-blue-500" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tiempo promedio de cálculo</span>
              <span className="text-sm font-medium">
                {systemMetrics?.average_calculation_time || 0}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tasa de errores</span>
              <span className="text-sm font-medium">
                {systemMetrics?.error_rate?.toFixed(2) || 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cache hit rate</span>
              <span className="text-sm font-medium">
                {systemMetrics?.cache_hit_rate?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Actividad</h3>
            <BarChart3 className="w-6 h-6 text-green-500" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Conexiones WebSocket</span>
              <span className="text-sm font-medium">
                {systemMetrics?.websocket_connections || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cálculos hoy</span>
              <span className="text-sm font-medium">
                {systemMetrics?.calculations_today || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Participantes activos</span>
              <span className="text-sm font-medium">
                {systemMetrics?.total_participants || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Estadísticas</h3>
            <PieChart className="w-6 h-6 text-purple-500" />
          </div>
          {stats && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Evaluaciones completadas</span>
                <span className="text-sm font-medium">
                  {stats.completed_evaluations}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Evaluaciones pendientes</span>
                <span className="text-sm font-medium">
                  {stats.pending_evaluations}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Progreso general</span>
                <span className="text-sm font-medium">
                  {stats.progress_percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico de progreso */}
      {selectedCompetition && selectedCategory && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Progreso de Evaluaciones</h3>
          <RankingProgressChart
            competitionId={selectedCompetition}
            categoryId={selectedCategory}
          />
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Centro de Notificaciones</h3>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
            </select>
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-lg border ${
                notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${getStatusColor(notification.type)}`}>
                  {getStatusIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                  {notification.data && (
                    <div className="mt-2 text-xs text-gray-600">
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(notification.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard de Rankings
              </h1>
              <p className="text-gray-600">
                Monitoreo en tiempo real del sistema de rankings FEI
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Resumen', icon: Activity },
              { key: 'live', label: 'En Vivo', icon: Signal },
              { key: 'metrics', label: 'Métricas', icon: BarChart3 },
              { key: 'notifications', label: 'Notificaciones', icon: AlertCircle, badge: unreadCount }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedView(tab.key as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedView === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
                {tab.badge && tab.badge > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={selectedView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {selectedView === 'overview' && renderOverview()}
          {selectedView === 'live' && renderLiveView()}
          {selectedView === 'metrics' && renderMetrics()}
          {selectedView === 'notifications' && renderNotifications()}
        </motion.div>
      </div>
    </div>
  );
}

// Componente RankingMetricsCard auxiliar
interface RankingMetricsCardProps {
  title: string;
  value: number;
  unit?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
  loading?: boolean;
}

function RankingMetricsCard({ title, value, unit, icon, color, loading }: RankingMetricsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-6 w-6 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {value.toLocaleString()}
        {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

// Componente RankingProgressChart auxiliar
interface RankingProgressChartProps {
  competitionId: string;
  categoryId: string;
}

function RankingProgressChart({ competitionId, categoryId }: RankingProgressChartProps) {
  const { data: progress } = useRankingStats(competitionId, categoryId);

  if (!progress) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
          <p className="text-gray-600">Cargando progreso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl font-bold text-blue-600 mb-2">
          {progress.progress_percentage.toFixed(1)}%
        </div>
        <p className="text-gray-600">Progreso completado</p>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-green-600">{progress.completed_evaluations}</div>
            <div className="text-gray-600">Completadas</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-yellow-600">{progress.pending_evaluations}</div>
            <div className="text-gray-600">Pendientes</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{progress.total_participants}</div>
            <div className="text-gray-600">Participantes</div>
          </div>
        </div>
      </div>
    </div>
  );
}