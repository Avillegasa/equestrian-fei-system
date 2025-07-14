// 🏆 Premium Ranking Table - Subfase 6.5.4.1
// Archivo: frontend/src/components/rankings/PremiumRankingTable.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Medal, 
  Trophy, 
  Crown,
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  Clock, 
  Star,
  Award,
  Timer,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

// === TIPOS Y INTERFACES ===
interface ParticipantData {
  id: string;
  position: number;
  rider_name: string;
  horse_name: string;
  total_score: number;
  percentage_score: number;
  position_change: number;
  evaluations_completed: number;
  evaluations_total: number;
  judge_scores: { judge_name: string; score: number; }[];
  country: string;
  category: string;
}

interface PremiumRankingTableProps {
  entries: ParticipantData[];
  competitionName: string;
  categoryName: string;
  showPositionChanges?: boolean;
  showJudgeBreakdown?: boolean;
  animateChanges?: boolean;
  maxEntries?: number;
  className?: string;
}

// === COMPONENTE MEDALLÓN DE POSICIÓN ===
const PositionMedallion = ({ position, size = 'md' }: { position: number; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg'
  };

  const getPositionStyle = (pos: number) => {
    if (pos === 1) return 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/30';
    if (pos === 2) return 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 text-white shadow-lg shadow-gray-500/30';
    if (pos === 3) return 'bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white shadow-lg shadow-amber-700/30';
    if (pos <= 5) return 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/20';
    if (pos <= 10) return 'bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white shadow-lg shadow-green-600/20';
    return 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/20';
  };

  const getPositionIcon = (pos: number) => {
    if (pos === 1) return <Crown className="w-4 h-4" />;
    if (pos === 2) return <Medal className="w-4 h-4" />;
    if (pos === 3) return <Award className="w-4 h-4" />;
    return null;
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${getPositionStyle(position)} rounded-full flex items-center justify-center font-bold relative overflow-hidden`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
      whileHover={{ scale: 1.1, rotate: 5 }}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      />
      
      <div className="relative z-10 flex items-center justify-center">
        {position <= 3 ? getPositionIcon(position) : position}
      </div>
    </motion.div>
  );
};

// === COMPONENTE INDICADOR DE CAMBIO ===
const PositionChangeIndicator = ({ change }: { change: number }) => {
  if (change === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400">
        <Minus className="w-4 h-4" />
        <span className="ml-1 text-xs">—</span>
      </div>
    );
  }

  const isPositive = change > 0;
  return (
    <motion.div
      className={`flex items-center justify-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}
      initial={{ scale: 0, y: isPositive ? 10 : -10 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {isPositive ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      <span className="ml-1 text-xs font-medium">
        {Math.abs(change)}
      </span>
    </motion.div>
  );
};

// === COMPONENTE BARRA DE PROGRESO ===
const EvaluationProgress = ({ completed, total }: { completed: number; total: number }) => {
  const percentage = (completed / total) * 100;
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs text-gray-600 min-w-[2rem]">
        {completed}/{total}
      </span>
    </div>
  );
};

// === COMPONENTE PRINCIPAL ===
export const PremiumRankingTable: React.FC<PremiumRankingTableProps> = ({
  entries,
  competitionName,
  categoryName,
  showPositionChanges = true,
  showJudgeBreakdown = false,
  animateChanges = true,
  maxEntries = 20,
  className = ''
}) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'position' | 'score' | 'name'>('position');
  
  const displayEntries = entries.slice(0, maxEntries);

  const getRowBackgroundClass = (position: number) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400';
    if (position === 2) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-gray-400';
    if (position === 3) return 'bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-600';
    if (position <= 5) return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500';
    if (position % 2 === 0) return 'bg-gray-50/50';
    return 'bg-white';
  };

  const toggleRowExpansion = (participantId: string) => {
    setExpandedRow(expandedRow === participantId ? null : participantId);
  };

  return (
    <div className={`bg-white rounded-xl shadow-2xl overflow-hidden ${className}`}>
      {/* Header Premium */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              {competitionName}
            </h2>
            <p className="text-slate-300 text-lg">{categoryName}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="w-4 h-4" />
              <span>{entries.length} participantes</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 mt-1">
              <Timer className="w-4 h-4" />
              <span>Actualizado: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Premium */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 border-b-2 border-slate-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Posición
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Participante
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Puntuación
              </th>
              {showPositionChanges && (
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Cambio
                </th>
              )}
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Progreso
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-100">
            <AnimatePresence>
              {displayEntries.map((entry, index) => (
                <React.Fragment key={entry.id}>
                  <motion.tr
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`${getRowBackgroundClass(entry.position)} hover:shadow-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 cursor-pointer`}
                    onClick={() => toggleRowExpansion(entry.id)}
                  >
                    {/* Posición con medallón */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <PositionMedallion position={entry.position} />
                        <div className="text-xs text-gray-500">
                          #{entry.position}
                        </div>
                      </div>
                    </td>

                    {/* Información del participante */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {entry.rider_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">
                            {entry.rider_name}
                          </div>
                          <div className="text-gray-600 text-sm flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {entry.horse_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.country} • {entry.category}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Puntuación */}
                    <td className="px-6 py-4 text-center">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-gray-900">
                          {entry.total_score.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {entry.percentage_score.toFixed(1)}%
                        </div>
                      </div>
                    </td>

                    {/* Cambio de posición */}
                    {showPositionChanges && (
                      <td className="px-6 py-4 text-center">
                        <PositionChangeIndicator change={entry.position_change} />
                      </td>
                    )}

                    {/* Progreso de evaluación */}
                    <td className="px-6 py-4 text-center">
                      <EvaluationProgress 
                        completed={entry.evaluations_completed} 
                        total={entry.evaluations_total} 
                      />
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {expandedRow === entry.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </motion.button>
                    </td>
                  </motion.tr>

                  {/* Fila expandida con detalles */}
                  <AnimatePresence>
                    {expandedRow === entry.id && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td colSpan={6} className="px-6 py-4 bg-slate-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Puntuaciones por juez */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">
                                Puntuaciones por Juez
                              </h4>
                              <div className="space-y-2">
                                {entry.judge_scores.map((judge, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-white rounded p-2">
                                    <span className="text-sm text-gray-700">{judge.judge_name}</span>
                                    <span className="font-semibold text-blue-600">
                                      {judge.score.toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Estadísticas adicionales */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">
                                Estadísticas
                              </h4>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-white rounded p-2">
                                  <div className="text-gray-600">Evaluaciones</div>
                                  <div className="font-semibold">
                                    {entry.evaluations_completed}/{entry.evaluations_total}
                                  </div>
                                </div>
                                <div className="bg-white rounded p-2">
                                  <div className="text-gray-600">Promedio</div>
                                  <div className="font-semibold">
                                    {(entry.judge_scores.reduce((sum, j) => sum + j.score, 0) / entry.judge_scores.length).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Footer con estadísticas */}
      <div className="bg-slate-100 px-6 py-4 flex justify-between items-center text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>Mostrando {displayEntries.length} de {entries.length} participantes</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Última actualización: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};