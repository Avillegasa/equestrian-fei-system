// 📊 Analytics Dashboard - Subfase 6.5.4.3
// Archivo: frontend/src/components/rankings/AnalyticsDashboard.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Award, 
  Clock, 
  Target,
  Download,
  Filter,
  Eye,
  Activity,
  Gauge,
  Zap
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart,
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// === TIPOS Y INTERFACES ===
interface JudgeData {
  id: string;
  name: string;
  total_evaluations: number;
  completed_evaluations: number;
  average_score: number;
  score_variance: number;
  categories_judged: string[];
}

interface ScoreDistribution {
  score_range: string;
  count: number;
  percentage: number;
}

interface CategoryPerformance {
  category: string;
  average_score: number;
  participants_count: number;
  completion_rate: number;
}

interface AnalyticsData {
  competition_name: string;
  total_participants: number;
  total_evaluations: number;
  completed_evaluations: number;
  average_score: number;
  score_distribution: ScoreDistribution[];
  judges: JudgeData[];
  categories: CategoryPerformance[];
  hourly_activity: { hour: string; evaluations: number; }[];
  top_performers: { name: string; score: number; }[];
}

interface AnalyticsDashboardProps {
  analyticsData: AnalyticsData;
  competitionId: string;
  onExport?: (format: 'pdf' | 'excel' | 'json') => void;
  className?: string;
}

// === COMPONENTE CHART WRAPPER CLIENT-ONLY ===
const ClientOnlyChart = ({ children, height = "250px" }: { children: React.ReactNode; height?: string }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Cargando gráfico...</p>
        </div>
      </div>
    );
  }

  return <div>{children}</div>;
};

// === COMPONENTE MÉTRICA CARD ===
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = 'blue',
  delay = 0 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  delay?: number;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-blue-600',
    green: 'from-green-500 to-green-600 text-green-600',
    purple: 'from-purple-500 to-purple-600 text-purple-600',
    orange: 'from-orange-500 to-orange-600 text-orange-600',
    red: 'from-red-500 to-red-600 text-red-600'
  };

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4 text-green-500" />,
    down: <TrendingDown className="w-4 h-4 text-red-500" />,
    neutral: <Activity className="w-4 h-4 text-gray-500" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <div className={`h-2 bg-gradient-to-r ${colorClasses[color]}`} />
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[color]} bg-opacity-10`}>
            {mounted ? (
              <Icon className={`w-8 h-8 ${colorClasses[color].split(' ')[2]}`} />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded animate-pulse" />
            )}
          </div>
          {trend && mounted && (
            <div className="flex items-center gap-1">
              {trendIcons[trend]}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </h3>
          <div className="text-3xl font-bold text-gray-900">
            {value}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// === COMPONENTE GRÁFICO PERSONALIZADO ===
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// === COMPONENTE PRINCIPAL ===
export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analyticsData,
  competitionId,
  onExport,
  className = ''
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'hour' | 'day' | 'week'>('hour');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'judges' | 'performance'>('overview');
  const [mounted, setMounted] = useState(false);

  // Solo renderizar gráficos en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cálculos derivados
  const completionRate = useMemo(() => {
    return (analyticsData.completed_evaluations / analyticsData.total_evaluations) * 100;
  }, [analyticsData]);

  const judgeEfficiency = useMemo(() => {
    return analyticsData.judges.map(judge => ({
      name: judge.name,
      efficiency: (judge.completed_evaluations / judge.total_evaluations) * 100,
      consistency: 100 - (judge.score_variance * 10), // Simplificado
      workload: judge.total_evaluations
    }));
  }, [analyticsData.judges]);

  const scoreDistributionColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Datos para radar chart de jueces
  const judgeRadarData = useMemo(() => {
    return analyticsData.judges.slice(0, 5).map(judge => ({
      judge: judge.name,
      efficiency: (judge.completed_evaluations / judge.total_evaluations) * 100,
      average: judge.average_score * 10,
      consistency: 100 - (judge.score_variance * 10),
      workload: (judge.total_evaluations / Math.max(...analyticsData.judges.map(j => j.total_evaluations))) * 100
    }));
  }, [analyticsData.judges]);

  const exportData = (format: 'pdf' | 'excel' | 'json') => {
    if (onExport) {
      onExport(format);
    } else {
      // Fallback: download as JSON
      const dataToExport = {
        competition: analyticsData.competition_name,
        exported_at: new Date().toISOString(),
        metrics: {
          total_participants: analyticsData.total_participants,
          completion_rate: completionRate,
          average_score: analyticsData.average_score
        },
        judges: judgeEfficiency,
        categories: analyticsData.categories
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_${competitionId}_${format}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Loading component mientras se monta
  if (!mounted) {
    return (
      <div className={`bg-gray-50 min-h-screen ${className}`}>
        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">{analyticsData.competition_name}</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando dashboard de analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      {/* Header */}
      <motion.div 
        className="bg-white shadow-sm border-b border-gray-200 p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">{analyticsData.competition_name}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Filtros */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas las categorías</option>
                {analyticsData.categories.map(cat => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category}
                  </option>
                ))}
              </select>
            </div>

            {/* Botones de exportación */}
            <div className="flex gap-2">
              <motion.button
                onClick={() => exportData('json')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-4 h-4" />
                Exportar
              </motion.button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Resumen', icon: Eye },
            { id: 'judges', label: 'Jueces', icon: Users },
            { id: 'performance', label: 'Rendimiento', icon: Target }
          ].map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Contenido principal */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* TAB: RESUMEN */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Métricas principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Participantes Totales"
                  value={analyticsData.total_participants}
                  subtitle="Competidores registrados"
                  icon={Users}
                  color="blue"
                  trend="neutral"
                  delay={0}
                />
                <MetricCard
                  title="Progreso Completado"
                  value={`${completionRate.toFixed(1)}%`}
                  subtitle={`${analyticsData.completed_evaluations}/${analyticsData.total_evaluations} evaluaciones`}
                  icon={Target}
                  color="green"
                  trend={completionRate > 80 ? 'up' : completionRate > 50 ? 'neutral' : 'down'}
                  delay={0.1}
                />
                <MetricCard
                  title="Puntuación Promedio"
                  value={analyticsData.average_score.toFixed(2)}
                  subtitle="Sobre 10.0 puntos"
                  icon={Award}
                  color="purple"
                  trend="neutral"
                  delay={0.2}
                />
                <MetricCard
                  title="Jueces Activos"
                  value={analyticsData.judges.length}
                  subtitle="Evaluadores asignados"
                  icon={Gauge}
                  color="orange"
                  trend="neutral"
                  delay={0.3}
                />
              </div>

              {/* Gráficos principales */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Actividad por hora */}
                <motion.div 
                  className="bg-white rounded-xl shadow-lg p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-6 h-6 text-blue-600" />
                    Actividad por Hora
                  </h3>
                  <ClientOnlyChart height="256px">
                    <ResponsiveContainer width="100%" height={256}>
                      <AreaChart data={analyticsData.hourly_activity} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="evaluations" 
                          stroke="#3B82F6" 
                          fillOpacity={1} 
                          fill="url(#colorActivity)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ClientOnlyChart>
                </motion.div>

                {/* Rendimiento por categoría */}
                <motion.div 
                  className="bg-white rounded-xl shadow-lg p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    Rendimiento por Categoría
                  </h3>
                  <ClientOnlyChart height="256px">
                    <ResponsiveContainer width="100%" height={256}>
                      <BarChart data={analyticsData.categories} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="category" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="average_score" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ClientOnlyChart>
                </motion.div>
              </div>

              {/* Top Performers */}
              <motion.div 
                className="bg-white rounded-xl shadow-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Mejores Puntuaciones
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {analyticsData.top_performers.slice(0, 5).map((performer, index) => (
                    <motion.div
                      key={performer.name}
                      className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 text-center border border-yellow-200"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <div className="text-2xl font-bold text-yellow-600 mb-1">
                        #{index + 1}
                      </div>
                      <div className="font-semibold text-gray-900 text-sm mb-1">
                        {performer.name}
                      </div>
                      <div className="text-lg font-bold text-orange-600">
                        {performer.score.toFixed(2)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* TAB: JUECES */}
          {activeTab === 'judges' && (
            <motion.div
              key="judges"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Métricas de jueces */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Eficiencia Promedio"
                  value={`${judgeEfficiency.reduce((acc, j) => acc + j.efficiency, 0) / judgeEfficiency.length || 0}%`}
                  subtitle="Evaluaciones completadas"
                  icon={Zap}
                  color="green"
                  trend="up"
                />
                <MetricCard
                  title="Carga de Trabajo"
                  value={Math.round(analyticsData.total_evaluations / analyticsData.judges.length)}
                  subtitle="Evaluaciones por juez"
                  icon={Activity}
                  color="blue"
                  trend="neutral"
                />
                <MetricCard
                  title="Consistencia Media"
                  value={`${judgeEfficiency.reduce((acc, j) => acc + j.consistency, 0) / judgeEfficiency.length || 0}%`}
                  subtitle="Variabilidad de puntuaciones"
                  icon={Target}
                  color="purple"
                  trend="up"
                />
              </div>

              {/* Radar Chart de Jueces */}
              <motion.div 
                className="bg-white rounded-xl shadow-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Análisis Multidimensional de Jueces
                </h3>
                <ClientOnlyChart height="384px">
                  <ResponsiveContainer width="100%" height={384}>
                    <RadarChart data={judgeRadarData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="judge" className="text-sm" />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 100]} 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <Radar 
                        name="Eficiencia" 
                        dataKey="efficiency" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Radar 
                        name="Puntuación Media" 
                        dataKey="average" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Radar 
                        name="Consistencia" 
                        dataKey="consistency" 
                        stroke="#F59E0B" 
                        fill="#F59E0B" 
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                      <Legend />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ClientOnlyChart>
              </motion.div>

              {/* Tabla de eficiencia de jueces */}
              <motion.div 
                className="bg-white rounded-xl shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Rendimiento Individual de Jueces
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Juez
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Eficiencia
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Consistencia
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Carga de Trabajo
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {judgeEfficiency.map((judge, index) => (
                        <motion.tr
                          key={judge.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                {judge.name.charAt(0)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {judge.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${judge.efficiency}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {judge.efficiency.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{ width: `${judge.consistency}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {judge.consistency.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm text-gray-900">
                              {judge.workload} evaluaciones
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              judge.efficiency > 80 
                                ? 'bg-green-100 text-green-800'
                                : judge.efficiency > 50 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {judge.efficiency > 80 ? 'Excelente' : judge.efficiency > 50 ? 'Regular' : 'Necesita mejora'}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* TAB: RENDIMIENTO */}
          {activeTab === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Tendencias de rendimiento */}
              <motion.div 
                className="bg-white rounded-xl shadow-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  Tendencias de Rendimiento por Categoría
                </h3>
                <ClientOnlyChart height="384px">
                  <ResponsiveContainer width="100%" height={384}>
                    <LineChart data={analyticsData.categories} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="category" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="average_score" 
                        stroke="#3B82F6" 
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                        name="Puntuación Promedio"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completion_rate" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                        name="Tasa de Finalización (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ClientOnlyChart>
              </motion.div>

              {/* Comparación de categorías */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div 
                  className="bg-white rounded-xl shadow-lg p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Participación por Categoría
                  </h3>
                  <ClientOnlyChart height="256px">
                    <ResponsiveContainer width="100%" height={256}>
                      <BarChart data={analyticsData.categories} layout="horizontal" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" stroke="#6b7280" fontSize={12} />
                        <YAxis dataKey="category" type="category" stroke="#6b7280" width={80} fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="participants_count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ClientOnlyChart>
                </motion.div>

                <motion.div 
                  className="bg-white rounded-xl shadow-lg p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Resumen de Rendimiento
                  </h3>
                  <div className="space-y-4">
                    {analyticsData.categories.map((category, index) => (
                      <motion.div
                        key={category.category}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {category.category}
                          </h4>
                          <span className="text-lg font-bold text-blue-600">
                            {category.average_score.toFixed(2)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Participantes:</span> {category.participants_count}
                          </div>
                          <div>
                            <span className="font-medium">Finalización:</span> {category.completion_rate.toFixed(1)}%
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};