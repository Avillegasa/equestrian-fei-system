// Archivo: frontend/src/app/test-cinematic/page.tsx
'use client';

import { CinematicPublicDisplay } from '@/components/rankings/CinematicPublicDisplay';

// Mismos datos de prueba que antes
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
    country: 'CHI',
    category: 'Intermedio'
  },
  {
    id: '6',
    position: 6,
    rider_name: 'Roberto Fernández',
    horse_name: 'Shadow',
    total_score: 7.8,
    percentage_score: 78.0,
    position_change: 1,
    evaluations_completed: 4,
    evaluations_total: 5,
    country: 'URU',
    category: 'Intermedio'
  },
  {
    id: '7',
    position: 7,
    rider_name: 'Isabella Cruz',
    horse_name: 'Spirit',
    total_score: 7.5,
    percentage_score: 75.0,
    position_change: -1,
    evaluations_completed: 5,
    evaluations_total: 5,
    country: 'PER',
    category: 'Intermedio'
  }
];

export default function TestCinematicPage() {
  return (
    <div>
      <div className="p-6 bg-white">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎬 Test - Cinematic Public Display
        </h1>
        
        <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h2 className="font-semibold text-purple-900 mb-2">¿Qué deberías ver?</h2>
          <ul className="text-purple-800 text-sm space-y-1">
            <li>✅ Fondo gradiente con partículas animadas</li>
            <li>✅ Header elegante con estado de conexión</li>
            <li>✅ Medallones 3D con efectos de brillo</li>
            <li>✅ Efectos de partículas doradas para top 3</li>
            <li>✅ Auto-rotación de páginas cada 10 segundos</li>
            <li>✅ Highlighting automático de entradas</li>
            <li>✅ Botón fullscreen funcional</li>
          </ul>
        </div>

        <div className="mb-4 flex gap-4">
          <div className="bg-green-100 border border-green-300 rounded p-3 text-green-800 text-sm">
            <strong>Tip:</strong> Haz clic en el botón fullscreen (esquina superior derecha) para ver el efecto completo
          </div>
        </div>
      </div>

      <CinematicPublicDisplay
        entries={mockEntries}
        competitionName="Copa Nacional de Doma 2024"
        categoryName="Categoría Intermedia"
        location="Centro Ecuestre Nacional"
        date="15 de Julio, 2025"
        isConnected={true}
        autoRotate={true}
        rotationInterval={10}
        showTop={10}
        theme="branded"
        logoUrl="/logo-ecuestre.png" // Opcional
      />
    </div>
  );
}