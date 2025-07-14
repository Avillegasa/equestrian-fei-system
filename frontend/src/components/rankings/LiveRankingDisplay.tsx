// Archivo: frontend/src/components/rankings/LiveRankingDisplay.tsx (MODIFICAR)

import React, { useState } from 'react';
import { PremiumRankingTable } from './PremiumRankingTable';
import { CinematicPublicDisplay } from './CinematicPublicDisplay';

// Mantener tu lógica existente de hooks y datos
export function LiveRankingDisplay({ competitionId, categoryId, showControls = true, maxEntries = 20, className = '' }) {
  const [viewMode, setViewMode] = useState<'premium' | 'cinematic' | 'classic'>('premium');
  
  // Tu lógica existente de datos...
  const { ranking, isLoading, error, isConnected, refetch } = useLiveRanking({ 
    competition_id: competitionId, 
    category_id: categoryId 
  });

  // Convertir datos al formato esperado por los nuevos componentes
  const formattedEntries = ranking?.entries?.map(entry => ({
    id: entry.participant.id,
    position: entry.position,
    rider_name: entry.participant_name,
    horse_name: entry.horse_name,
    total_score: entry.total_score,
    percentage_score: entry.percentage_score,
    position_change: entry.position_change || 0,
    evaluations_completed: entry.evaluations_completed,
    evaluations_total: entry.evaluations_total,
    judge_scores: entry.judge_scores || [],
    country: entry.participant.country || 'N/A',
    category: ranking.category_name
  })) || [];

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error cargando ranking</div>;

  return (
    <div className={className}>
      {/* Selector de modo de vista */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setViewMode('premium')}
          className={`px-4 py-2 rounded ${viewMode === 'premium' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Vista Premium
        </button>
        <button
          onClick={() => setViewMode('cinematic')}
          className={`px-4 py-2 rounded ${viewMode === 'cinematic' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Display Público
        </button>
        <button
          onClick={() => setViewMode('classic')}
          className={`px-4 py-2 rounded ${viewMode === 'classic' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Vista Clásica
        </button>
      </div>

      {/* Renderizar componente según modo */}
      {viewMode === 'premium' && (
        <PremiumRankingTable
          entries={formattedEntries}
          competitionName={ranking.competition_name}
          categoryName={ranking.category_name}
          showPositionChanges={true}
          animateChanges={true}
          maxEntries={maxEntries}
        />
      )}

      {viewMode === 'cinematic' && (
        <CinematicPublicDisplay
          entries={formattedEntries}
          competitionName={ranking.competition_name}
          categoryName={ranking.category_name}
          location="Ubicación de la competencia" // Obtener de tus datos
          date={new Date().toLocaleDateString()}
          isConnected={isConnected}
          autoRotate={true}
          showTop={maxEntries}
        />
      )}

      {viewMode === 'classic' && (
        // Tu componente original aquí
        <div>Tu tabla original existente...</div>
      )}
    </div>
  );
}