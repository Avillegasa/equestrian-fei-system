// frontend/src/components/scoring/ParticipantCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Horse, 
  Trophy,
  Star,
  Award,
  Flag
} from 'lucide-react';

interface Participant {
  id: number;
  rider_name: string;
  horse_name: string;
  participant_number: string;
  category: string;
  photo_url?: string;
  horse_photo_url?: string;
  nationality?: string;
  club?: string;
  age?: number;
  horse_age?: number;
  horse_breed?: string;
}

interface ParticipantCardProps {
  participant: Participant;
  currentScore: number;
  maxScore: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export function ParticipantCard({
  participant,
  currentScore,
  maxScore,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext
}: ParticipantCardProps) {
  const progressPercentage = maxScore > 0 ? (currentScore / maxScore) * 100 : 0;
  
  // Determinar color del progreso según puntuación
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 85) return 'bg-blue-500';
    if (percentage >= 75) return 'bg-emerald-500';
    if (percentage >= 65) return 'bg-green-500';
    if (percentage >= 55) return 'bg-yellow-500';
    if (percentage >= 45) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreGrade = (percentage: number): string => {
    if (percentage >= 85) return 'Excelente';
    if (percentage >= 75) return 'Muy Bueno';
    if (percentage >= 65) return 'Bueno';
    if (percentage >= 55) return 'Satisfactorio';
    if (percentage >= 45) return 'Suficiente';
    return 'Insuficiente';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden shadow-2xl border-0 bg-gradient-to-br from-white via-gray-50 to-gray-100">
        {/* Header con navegación */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="text-center">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                #{participant.participant_number}
              </Badge>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              disabled={!canGoNext}
              className="text-white hover:bg-white/20"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          {/* Foto del jinete - Diseño magazine */}
          <div className="relative h-64 bg-gradient-to-br from-blue-100 to-blue-50">
            {participant.photo_url ? (
              <img
                src={participant.photo_url}
                alt={participant.rider_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-20 w-20 text-blue-300" />
              </div>
            )}
            
            {/* Overlay con información básica */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <h2 className="text-xl font-bold text-white mb-1">
                {participant.rider_name}
              </h2>
              <div className="flex items-center space-x-2">
                {participant.nationality && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    <Flag className="h-3 w-3 mr-1" />
                    {participant.nationality}
                  </Badge>
                )}
                {participant.age && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {participant.age} años
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Información del caballo */}
          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {participant.horse_photo_url ? (
                  <img
                    src={participant.horse_photo_url}
                    alt={participant.horse_name}
                    className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center border-2 border-amber-200">
                    <Horse className="h-8 w-8 text-amber-600" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-800 mb-1">
                  {participant.horse_name}
                </h3>
                <div className="space-y-1">
                  {participant.horse_breed && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Raza:</span> {participant.horse_breed}
                    </p>
                  )}
                  {participant.horse_age && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Edad:</span> {participant.horse_age} años
                    </p>
                  )}
                  {participant.club && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Club:</span> {participant.club}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Categoría */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-amber-600" />
                <span className="font-medium text-amber-800">Categoría</span>
              </div>
              <Badge variant="default" className="bg-amber-600 text-white">
                {participant.category}
              </Badge>
            </div>

            {/* Puntuación actual */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700 flex items-center space-x-2">
                  <Star className="h-4 w-4 text-blue-600" />
                  <span>Puntuación Actual</span>
                </h4>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">
                    {currentScore.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    {getScoreGrade(currentScore)}
                  </p>
                </div>
              </div>

              {/* Barra de progreso premium */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full ${getProgressColor(progressPercentage)} relative`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                    </motion.div>
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Medallas/Logros (si existen) */}
            {currentScore >= 85 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200"
              >
                <Award className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-medium text-sm">
                  ¡Actuación Excelente!
                </span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}