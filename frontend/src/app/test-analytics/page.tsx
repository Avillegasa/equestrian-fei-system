// Archivo: frontend/src/app/test-analytics/page.tsx
'use client';

import { AnalyticsDashboard } from '@/components/rankings/AnalyticsDashboard';

// Datos mock para analytics
const mockAnalyticsData = {
  competition_name: "Copa Nacional de Doma 2024",
  total_participants: 45,
  total_evaluations: 180,
  completed_evaluations: 156,
  average_score: 7.3,
  score_distribution: [
    { score_range: "9.0-10.0", count: 8, percentage: 17.8 },
    { score_range: "8.0-8.9", count: 15, percentage: 33.3 },
    { score_range: "7.0-7.9", count: 12, percentage: 26.7 },
    { score_range: "6.0-6.9", count: 7, percentage: 15.6 },
    { score_range: "5.0-5.9", count: 3, percentage: 6.7 }
  ],
  judges: [
    {
      id: "j1",
      name: "Carlos Mendoza",
      total_evaluations: 36,
      completed_evaluations: 32,
      average_score: 7.5,
      score_variance: 0.8,
      categories_judged: ["Intermedio", "Avanzado"]
    },
    {
      id: "j2", 
      name: "María Torres",
      total_evaluations: 40,
      completed_evaluations: 38,
      average_score: 7.8,
      score_variance: 0.6,
      categories_judged: ["Principiante", "Intermedio"]
    },
    {
      id: "j3",
      name: "Luis Herrera", 
      total_evaluations: 32,
      completed_evaluations: 30,
      average_score: 7.2,
      score_variance: 1.0,
      categories_judged: ["Avanzado"]
    },
    {
      id: "j4",
      name: "Ana Beltrán",
      total_evaluations: 38,
      completed_evaluations: 36,
      average_score: 7.6,
      score_variance: 0.7,
      categories_judged: ["Principiante", "Intermedio", "Avanzado"]
    },
    {
      id: "j5",
      name: "Roberto Silva",
      total_evaluations: 34,
      completed_evaluations: 20,
      average_score: 7.0,
      score_variance: 1.2,
      categories_judged: ["Intermedio"]
    }
  ],
  categories: [
    {
      category: "Principiante",
      average_score: 6.8,
      participants_count: 15,
      completion_rate: 95.2
    },
    {
      category: "Intermedio", 
      average_score: 7.4,
      participants_count: 20,
      completion_rate: 88.5
    },
    {
      category: "Avanzado",
      average_score: 8.1,
      participants_count: 10,
      completion_rate: 92.0
    }
  ],
  hourly_activity: [
    { hour: "08:00", evaluations: 5 },
    { hour: "09:00", evaluations: 12 },
    { hour: "10:00", evaluations: 18 },
    { hour: "11:00", evaluations: 22 },
    { hour: "12:00", evaluations: 8 },
    { hour: "13:00", evaluations: 3 },
    { hour: "14:00", evaluations: 15 },
    { hour: "15:00", evaluations: 25 },
    { hour: "16:00", evaluations: 30 },
    { hour: "17:00", evaluations: 18 }
  ],
  top_performers: [
    { name: "Ana García", score: 9.2 },
    { name: "Luis Torres", score: 8.9 },
    { name: "Carmen Silva", score: 8.7 },
    { name: "Pedro Jiménez", score: 8.4 },
    { name: "Sofia Vargas", score: 8.1 }
  ]
};

export default function TestAnalyticsPage() {
  const handleExport = (format: 'pdf' | 'excel' | 'json') => {
    console.log(`🚀 Exportando en formato: ${format}`);
    alert(`Exportación ${format} iniciada (simulada)`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 bg-white border-b">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          📊 Test - Analytics Dashboard
        </h1>
        
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="font-semibold text-green-900 mb-2">¿Qué deberías ver?</h2>
          <ul className="text-green-800 text-sm space-y-1 grid grid-cols-1 md:grid-cols-2 gap-2">
            <li>✅ 4 tabs de navegación funcionales</li>
            <li>✅ Cards de métricas con animaciones</li>
            <li>✅ Gráficos de barras y áreas interactivos</li>
            <li>✅ Gráfico radar multidimensional</li>
            <li>✅ Tabla de jueces con barras de progreso</li>
            <li>✅ Gráfico circular (pie chart)</li>
            <li>✅ Tooltips informativos</li>
            <li>✅ Botón de exportación funcional</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="bg-blue-100 border border-blue-300 rounded p-3 text-blue-800 text-sm">
            <strong>Tip 1:</strong> Navega entre los tabs (Resumen, Jueces, Rendimiento, Distribución)
          </div>
          <div className="bg-purple-100 border border-purple-300 rounded p-3 text-purple-800 text-sm">
            <strong>Tip 2:</strong> Hover sobre los gráficos para ver tooltips
          </div>
          <div className="bg-orange-100 border border-orange-300 rounded p-3 text-orange-800 text-sm">
            <strong>Tip 3:</strong> Prueba el botón "Exportar" en la esquina superior derecha
          </div>
        </div>
      </div>

      <AnalyticsDashboard
        analyticsData={mockAnalyticsData}
        competitionId="comp_test_2024"
        onExport={handleExport}
      />
    </div>
  );
}