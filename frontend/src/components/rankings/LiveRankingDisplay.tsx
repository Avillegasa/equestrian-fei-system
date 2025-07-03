import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  Clock, 
  Signal,
  SignalZero,
  Maximize2,
  Minimize2,
  RefreshCw,
  Settings,
  Download,
  Share2
} from 'lucide-react';
import { useLiveRanking, useRankingProgress, usePositionChangeAnimations } from '@/hooks/useRankings';
import type { RankingEntry } from '@/types/rankings';

interface LiveRankingDisplayProps {
  competitionId: string;
  categoryId: string;
  showControls?: boolean;
  maxEntries?: number;
  className?: string;
}

export function LiveRankingDisplay({ 
  competitionId, 
  categoryId, 
  showControls = true,
  maxEntries = 20,
  className = ''
}: LiveRankingDisplayProps) {
  const [displaySettings, setDisplaySettings] = useState({
    showPercentages: true,
    showPositionChanges: true,
    showJudgeBreakdown: false,
    autoRefresh: true,
    refreshInterval: 10,
    theme: 'light' as 'light' | 'dark'
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { 
    ranking, 
    isLoading, 
    error, 
    isConnected, 
    connectionError,
    requestRanking,
    refetch 
  } = useLiveRanking({ competition_id: competitionId, category_id: categoryId });

  const { 
    data: progress, 
    isLoading: progressLoading 
  } = useRankingProgress(competitionId, categoryId);

  const { animations, addAnimation } = usePositionChangeAnimations();

  // Detectar cambios de posición y animar
  useEffect(() => {
    if (!ranking?.entries) return;

    const currentPositions = new Map(
      ranking.entries.map(entry => [entry.participant.id, entry.position])
    );

    // Comparar con posiciones anteriores (guardadas en localStorage)
    const previousPositionsKey = `positions_${competitionId}_${categoryId}`;
    const previousPositions = JSON.parse(
      localStorage.getItem(previousPositionsKey) || '{}'
    );

    // Detectar cambios y animar
    ranking.entries.forEach(entry => {
      const participantId = entry.participant.id;
      const currentPosition = entry.position;
      const previousPosition = previousPositions[participantId];

      if (previousPosition && previousPosition !== currentPosition) {
        addAnimation(participantId, previousPosition, currentPosition);
      }
    });

    // Guardar posiciones actuales
    const newPositions = Object.fromEntries(currentPositions);
    localStorage.setItem(previousPositionsKey, JSON.stringify(newPositions));
  }, [ranking?.entries, competitionId, categoryId, addAnimation]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Detectar cambios de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!displaySettings.autoRefresh) return;

    const interval = setInterval(() => {
      if (!isConnected) {
        refetch();
      }
    }, displaySettings.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [displaySettings.autoRefresh, displaySettings.refreshInterval, isConnected, refetch]);

  const getPositionChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getPositionChangeText = (change: number) => {
    if (change > 0) return `+${change}`;
    if (change < 0) return change.toString();
    return '—';
  };

  const exportRanking = useCallback(() => {
    if (!ranking) return;
    
    const data = {
      competition: ranking.competition_name,
      category: ranking.category_name,
      timestamp: new Date().toISOString(),
      entries: ranking.entries.slice(0, maxEntries).map(entry => ({
        position: entry.position,
        rider: entry.participant_name,
        horse: entry.horse_name,
        score: entry.total_score,
        percentage: entry.percentage_score
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranking_${ranking.competition_name}_${ranking.category_name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [ranking, maxEntries]);

  const shareRanking = useCallback(async () => {
    if (!ranking) return;
    
    const shareData = {
      title: `${ranking.competition_name} - ${ranking.category_name}`,
      text: `Ranking actualizado - ${progress?.progress_percentage.toFixed(1)}% completado`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // Aquí podrías mostrar una notificación de éxito
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [ranking, progress]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-500" />
          <p className="text-gray-600">Cargando ranking...</p>
        </div>
      </div>
    );
  }

  if (error || !ranking) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <SignalZero className="w-8 h-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-2">Error cargando ranking</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const displayEntries = ranking.entries.slice(0, maxEntries);

  return (
    <div className={`${className} ${displaySettings.theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {ranking.competition_name}
              </h1>
              <h2 className="text-xl opacity-90">
                {ranking.category_name}
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Estado de conexión */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Signal className="w-5 h-5 text-green-400" />
                ) : (
                  <SignalZero className="w-5 h-5 text-red-400" />
                )}
                <span className="text-sm">
                  {isConnected ? 'En vivo' : 'Desconectado'}
                </span>
              </div>

              {/* Progreso */}
              {progress && (
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">
                    {progress.progress_percentage.toFixed(1)}% completado
                  </span>
                </div>
              )}

              {/* Última actualización */}
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm">
                  {new Date(ranking.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          {progress && (
            <div className="mt-4">
              <div className="bg-white/20 rounded-full h-2">
                <motion.div
                  className="bg-white rounded-full h-2"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progress_percentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm opacity-90">
                <span>{progress.fully_evaluated} completados</span>
                <span>{progress.total_participants} participantes</span>
              </div>
            </div>
          )}
        </div>

        {/* Controles */}
        {showControls && (
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetch()}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Actualizar"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Pantalla completa"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Configuración"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportRanking}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Exportar"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={shareRanking}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Compartir"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Panel de configuración */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={displaySettings.showPercentages}
                        onChange={(e) => setDisplaySettings(prev => ({
                          ...prev,
                          showPercentages: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">Mostrar porcentajes</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={displaySettings.showPositionChanges}
                        onChange={(e) => setDisplaySettings(prev => ({
                          ...prev,
                          showPositionChanges: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">Cambios de posición</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={displaySettings.showJudgeBreakdown}
                        onChange={(e) => setDisplaySettings(prev => ({
                          ...prev,
                          showJudgeBreakdown: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">Desglose por juez</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={displaySettings.autoRefresh}
                        onChange={(e) => setDisplaySettings(prev => ({
                          ...prev,
                          autoRefresh: e.target.checked
                        }))}
                        className="rounded"
                      />
                      <span className="text-sm">Auto-actualizar</span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Tabla de ranking */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Posición
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Participante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Caballo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Puntuación
                </th>
                {displaySettings.showPercentages && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Porcentaje
                  </th>
                )}
                {displaySettings.showPositionChanges && (
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cambio
                  </th>
                )}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Progreso
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence>
                {displayEntries.map((entry, index) => {
                  const animation = animations.find(a => a.participantId === entry.participant.id);
                  
                  return (
                    <motion.tr
                      key={entry.participant.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        x: animation ? (animation.fromPosition < animation.toPosition ? 10 : -10) : 0
                      }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        entry.is_tied ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                      } ${
                        entry.position <= 3 ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''
                      } ${
                        entry.position === 1 ? 'ring-yellow-400' : 
                        entry.position === 2 ? 'ring-gray-400' : 
                        entry.position === 3 ? 'ring-yellow-600' : ''
                      }`}
                    >
                      {/* Posición */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                            entry.position === 1 ? 'bg-yellow-500 text-white' :
                            entry.position === 2 ? 'bg-gray-400 text-white' :
                            entry.position === 3 ? 'bg-yellow-600 text-white' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}>
                            {entry.position <= 3 ? (
                              <Trophy className="w-4 h-4" />
                            ) : (
                              <span className="text-sm font-medium">{entry.position}</span>
                            )}
                          </div>
                          {entry.position <= 3 && (
                            <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                              {entry.position}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Participante */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {entry.participant_name}
                        </div>
                      </td>

                      {/* Caballo */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {entry.horse_name}
                        </div>
                      </td>

                      {/* Puntuación */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {entry.total_score.toFixed(3)}
                        </div>
                      </td>

                      {/* Porcentaje */}
                      {displaySettings.showPercentages && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {entry.percentage_score.toFixed(2)}%
                          </div>
                        </td>
                      )}

                      {/* Cambio de posición */}
                      {displaySettings.showPositionChanges && (
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1">
                            {getPositionChangeIcon(entry.position_change)}
                            <span className="text-sm">
                              {getPositionChangeText(entry.position_change)}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Progreso */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${(entry.evaluations_completed / entry.evaluations_total) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                            {entry.evaluations_completed}/{entry.evaluations_total}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Desglose por juez */}
        {displaySettings.showJudgeBreakdown && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium mb-4">Desglose por Juez</h3>
            <div className="space-y-4">
              {displayEntries.slice(0, 5).map((entry) => (
                <div key={entry.participant.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">
                      #{entry.position} {entry.participant_name}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {entry.horse_name}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {Object.entries(entry.judge_scores).map(([judgeId, judgeData]) => (
                      <div key={judgeId} className="text-sm">
                        <span className="font-medium">{judgeData.judge_name}:</span>
                        <span className="ml-2">{judgeData.score.toFixed(3)}</span>
                        <span className="ml-1 text-gray-600 dark:text-gray-400">
                          ({judgeData.percentage.toFixed(2)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Última actualización: {new Date(ranking.timestamp).toLocaleString()}
            {connectionError && (
              <span className="ml-2 text-red-500">
                • Error: {connectionError}
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}