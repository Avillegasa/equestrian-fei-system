// Archivo: frontend/src/app/test-premium/page.tsx
'use client';

import { PremiumRankingTable } from '@/components/rankings/PremiumRankingTable';

// Datos de prueba
const mockEntries = [
  {
    id: '1',
    position: 1,
    rider_name: 'Ana García',
    horse_name: 'Thunder',
    total_score: 9.2,
    percentage_score: 92.0,
    position_change: 1,
    evaluations_completed: 5,
    evaluations_total: 5,
    judge_scores: [
      { judge_name: 'Carlos Mendoza', score: 9.1 },
      { judge_name: 'María Torres', score: 9.3 },
      { judge_name: 'Luis Herrera', score: 9.2 }
    ],
    country: 'ESP',
    category: 'Intermedio'
  },
  {
    id: '2',
    position: 2,
    rider_name: 'Luis Torres',
    horse_name: 'Lightning',
    total_score: 8.9,
    percentage_score: 89.0,
    position_change: -1,
    evaluations_completed: 4,
    evaluations_total: 5,
    judge_scores: [
      { judge_name: 'Carlos Mendoza', score: 8.8 },
      { judge_name: 'María Torres', score: 9.0 },
      { judge_name: 'Luis Herrera', score: 8.9 }
    ],
    country: 'ARG',
    category: 'Intermedio'
  },
  {
    id: '3',
    position: 3,
    rider_name: 'Carmen Silva',
    horse_name: 'Storm',
    total_score: 8.7,
    percentage_score: 87.0,
    position_change: 2,
    evaluations_completed: 5,
    evaluations_total: 5,
    judge_scores: [
      { judge_name: 'Carlos Mendoza', score: 8.6 },
      { judge_name: 'María Torres', score: 8.8 },
      { judge_name: 'Luis Herrera', score: 8.7 }
    ],
    country: 'COL',
    category: 'Intermedio'
  },
  {
    id: '4',
    position: 4,
    rider_name: 'Pedro Jiménez',
    horse_name: 'Wind',
    total_score: 8.4,
    percentage_score: 84.0,
    position_change: 0,
    evaluations_completed: 3,
    evaluations_total: 5,
    judge_scores: [
      { judge_name: 'Carlos Mendoza', score: 8.3 },
      { judge_name: 'María Torres', score: 8.5 }
    ],
    country: 'MEX',
    category: 'Intermedio'
  },
  {
    id: '5',
    position: 5,
    rider_name: 'Sofia Vargas',
    horse_name: 'Fire',
    total_score: 8.1,
    percentage_score: 81.0,
    position_change: -2,
    evaluations_completed: 5,
    evaluations_total: 5,
    judge_scores: [
      { judge_name: 'Carlos Mendoza', score: 8.0 },
      { judge_name: 'María Torres', score: 8.2 },
      { judge_name: 'Luis Herrera', score: 8.1 }
    ],
    country: 'CHI',
    category: 'Intermedio'
  }
];

export default function TestPremiumPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🧪 Test - Premium Ranking Table
        </h1>
        
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="font-semibold text-blue-900 mb-2">¿Qué deberías ver?</h2>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>✅ Medallones dorados, plateados y bronce para posiciones 1, 2, 3</li>
            <li>✅ Animaciones suaves al cargar la tabla</li>
            <li>✅ Hover effects en las filas</li>
            <li>✅ Indicadores de cambio de posición (flechas)</li>
            <li>✅ Barras de progreso animadas</li>
            <li>✅ Filas expandibles al hacer clic</li>
          </ul>
        </div>

        <PremiumRankingTable
          entries={mockEntries}
          competitionName="Copa Nacional de Doma 2024"
          categoryName="Categoría Intermedia"
          showPositionChanges={true}
          animateChanges={true}
          maxEntries={10}
        />
      </div>
    </div>
  );
}