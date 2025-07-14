'use client';

import { CinematicPublicDisplay } from '@/components/rankings/CinematicPublicDisplay';
import { useLiveRanking } from '@/hooks/useRankings';

export default function PublicDisplayPage() {
  const competitionId = "comp_1";
  const categoryId = "cat_1";
  
  const { ranking, isConnected } = useLiveRanking({ 
    competition_id: competitionId, 
    category_id: categoryId 
  });

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
    country: entry.participant.country || 'N/A',
    category: ranking.category_name
  })) || [];

  return (
    <CinematicPublicDisplay
      entries={formattedEntries}
      competitionName={ranking?.competition_name || 'Competencia'}
      categoryName={ranking?.category_name || 'Categoría'}
      location="Centro Ecuestre"
      date={new Date().toLocaleDateString()}
      isConnected={isConnected}
      autoRotate={true}
      rotationInterval={15}
      showTop={10}
      theme="branded"
      logoUrl="/logo-ecuestre.png" // Tu logo
    />
  );
}