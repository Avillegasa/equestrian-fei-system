'use client';

import { PremiumRankingTable } from '@/components/rankings/PremiumRankingTable';
import { useLiveRanking } from '@/hooks/useRankings';

export default function PremiumRankingsPage() {
  // Obtener datos de la URL o contexto
  const competitionId = "comp_1";
  const categoryId = "cat_1";
  
  const { ranking, isLoading, error } = useLiveRanking({ 
    competition_id: competitionId, 
    category_id: categoryId 
  });

  if (isLoading) return <div>Cargando rankings premium...</div>;
  if (error) return <div>Error: {error.message}</div>;

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

  return (
    <div className="container mx-auto p-6">
      <PremiumRankingTable
        entries={formattedEntries}
        competitionName={ranking.competition_name}
        categoryName={ranking.category_name}
        showPositionChanges={true}
        maxEntries={20}
      />
    </div>
  );
}