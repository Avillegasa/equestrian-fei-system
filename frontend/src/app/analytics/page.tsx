'use client';

import { AnalyticsDashboard } from '@/components/rankings/AnalyticsDashboard';
import { useState, useEffect } from 'react';

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular datos de analytics - reemplazar con tu API
    const mockAnalyticsData = {
      competition_name: "Copa Nacional de Doma",
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
        // Más jueces...
      ],
      categories: [
        {
          category: "Principiante",
          average_score: 6.8,
          participants_count: 15,
          completion_rate: 95.2
        },
        // Más categorías...
      ],
      hourly_activity: [
        { hour: "08:00", evaluations: 5 },
        { hour: "09:00", evaluations: 12 },
        { hour: "10:00", evaluations: 18 },
        // Más horas...
      ],
      top_performers: [
        { name: "Ana García", score: 9.2 },
        { name: "Luis Torres", score: 8.9 },
        // Más performers...
      ]
    };

    setTimeout(() => {
      setAnalyticsData(mockAnalyticsData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleExport = (format: 'pdf' | 'excel' | 'json') => {
    console.log(`Exportando en formato: ${format}`);
    // Implementar lógica de exportación
  };

  if (isLoading) return <div>Cargando analytics...</div>;

  return (
    <AnalyticsDashboard
      analyticsData={analyticsData}
      competitionId="comp_1"
      onExport={handleExport}
    />
  );
}