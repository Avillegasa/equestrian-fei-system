import { useState, useEffect } from 'react';
import useRankingStore from '../../store/rankingStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const RankingStats = ({ competitionId, loading }) => {
  const [activeChart, setActiveChart] = useState('overview');
  const [timeRange, setTimeRange] = useState('1h');

  const {
    rankingStats,
    competitionOverview,
    loadRankingStats
  } = useRankingStore();

  useEffect(() => {
    loadRankingStats();
  }, []);

  // Mock data for charts (in real app, this would come from API)
  const mockParticipationData = [
    { time: '10:00', participants: 45, active: 40 },
    { time: '10:30', participants: 47, active: 45 },
    { time: '11:00', participants: 50, active: 48 },
    { time: '11:30', participants: 52, active: 50 },
    { time: '12:00', participants: 54, active: 52 },
    { time: '12:30', participants: 54, active: 51 },
    { time: '13:00', participants: 56, active: 54 },
  ];

  const mockScoreDistribution = [
    { range: '0-20', count: 2, color: '#ef4444' },
    { range: '21-40', count: 8, color: '#f97316' },
    { range: '41-60', count: 15, color: '#eab308' },
    { range: '61-80', count: 20, color: '#22c55e' },
    { range: '81-100', count: 9, color: '#3b82f6' },
  ];

  const mockCategoryData = [
    { name: 'Dressage Inicial', participants: 18, avgScore: 72.5 },
    { name: 'Dressage Intermedio', participants: 15, avgScore: 68.2 },
    { name: 'Salto Básico', participants: 12, avgScore: 75.8 },
    { name: 'Salto Avanzado', participants: 9, avgScore: 71.3 },
  ];

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  const StatCard = ({ title, value, subtitle, color = 'blue', icon }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-1">
          <div className="flex items-center">
            {icon && <div className="text-2xl mr-3">{icon}</div>}
            <div>
              <div className={`text-2xl font-bold text-${color}-600`}>
                {value}
              </div>
              <div className="text-lg font-medium text-gray-900">
                {title}
              </div>
              {subtitle && (
                <div className="text-sm text-gray-500">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Rankings"
          value={competitionOverview?.total_rankings || 0}
          subtitle="En esta competencia"
          color="blue"
          icon="🏆"
        />
        <StatCard
          title="Rankings Activos"
          value={competitionOverview?.active_rankings || 0}
          subtitle="Actualizándose en vivo"
          color="green"
          icon="🟢"
        />
        <StatCard
          title="Total Participantes"
          value={competitionOverview?.total_participants || 0}
          subtitle="Registrados"
          color="purple"
          icon="👥"
        />
        <StatCard
          title="Categorías"
          value={competitionOverview?.categories?.length || 0}
          subtitle="Diferentes disciplinas"
          color="orange"
          icon="📊"
        />
      </div>

      {/* Chart Controls */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Análisis Detallado
            </h3>
            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="1h">Última hora</option>
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
              </select>

              {/* Chart Type Selector */}
              <div className="flex rounded-md shadow-sm">
                {[
                  { id: 'overview', name: 'Vista General', icon: '📈' },
                  { id: 'participation', name: 'Participación', icon: '👥' },
                  { id: 'scores', name: 'Puntuaciones', icon: '📊' },
                  { id: 'categories', name: 'Categorías', icon: '🏷️' }
                ].map((chart) => (
                  <button
                    key={chart.id}
                    onClick={() => setActiveChart(chart.id)}
                    className={`${
                      activeChart === chart.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } px-3 py-2 text-sm font-medium border border-gray-300 first:rounded-l-md last:rounded-r-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <span className="mr-1">{chart.icon}</span>
                    {chart.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Overview Chart */}
          {activeChart === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Rankings por Estado
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Activos', value: competitionOverview?.active_rankings || 0 },
                        { name: 'Pausados', value: 1 },
                        { name: 'Completados', value: 0 },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockScoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Actividad por Hora
                </h4>
                <div className="space-y-3">
                  {mockParticipationData.slice(-4).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{item.time}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(item.active / item.participants) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900 w-16 text-right">
                          {item.active}/{item.participants}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Participation Chart */}
          {activeChart === 'participation' && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Participación a lo Largo del Tiempo
              </h4>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={mockParticipationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="participants"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Total Participantes"
                  />
                  <Line
                    type="monotone"
                    dataKey="active"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Participantes Activos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Scores Chart */}
          {activeChart === 'scores' && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Distribución de Puntuaciones
              </h4>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={mockScoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Categories Chart */}
          {activeChart === 'categories' && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Participación por Categoría
              </h4>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={mockCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="participants" fill="#3b82f6" name="Participantes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Insights de Rendimiento
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl text-green-500 mb-2">📈</div>
              <div className="text-lg font-semibold text-gray-900">Tendencia Positiva</div>
              <div className="text-sm text-gray-500">
                La participación ha aumentado 12% en la última hora
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl text-blue-500 mb-2">🎯</div>
              <div className="text-lg font-semibold text-gray-900">Puntuación Promedio</div>
              <div className="text-sm text-gray-500">
                68.7 puntos - 5% por encima del promedio histórico
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl text-orange-500 mb-2">⚡</div>
              <div className="text-lg font-semibold text-gray-900">Rankings Activos</div>
              <div className="text-sm text-gray-500">
                Actualizaciones cada 30 segundos en promedio
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingStats;