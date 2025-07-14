// frontend/src/components/scoring/PremiumScoringPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Clock, 
  Star,
  ChevronLeft,
  ChevronRight,
  Target,
  Award,
  Horse,
  User
} from 'lucide-react';
import { PremiumScoreInput } from './PremiumScoreInput';
import { ParticipantCard } from './ParticipantCard';
import { ProgressTracker } from './ProgressTracker';

interface Participant {
  id: number;
  rider_name: string;
  horse_name: string;
  participant_number: string;
  category: string;
  photo_url?: string;
  horse_photo_url?: string;
}

interface EvaluationParameter {
  id: number;
  name: string;
  description: string;
  coefficient: number;
  max_score: number;
  current_score?: number;
  is_scored: boolean;
  needs_justification?: boolean;
}

interface PremiumScoringPanelProps {
  participants: Participant[];
  currentParticipantIndex: number;
  evaluationParameters: EvaluationParameter[];
  onScoreUpdate: (participantId: number, parameterId: number, score: number, justification?: string) => void;
  onParticipantChange: (index: number) => void;
  competitionName?: string;
  categoryName?: string;
}

export function PremiumScoringPanel({
  participants,
  currentParticipantIndex,
  evaluationParameters,
  onScoreUpdate,
  onParticipantChange,
  competitionName = "Competencia Ecuestre FEI",
  categoryName = "Categoría Intermedia"
}: PremiumScoringPanelProps) {
  const [currentParameterIndex, setCurrentParameterIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const currentParticipant = participants[currentParticipantIndex];
  const currentParameter = evaluationParameters[currentParameterIndex];
  
  // Calcular progreso
  const scoredParameters = evaluationParameters.filter(p => p.is_scored).length;
  const totalParameters = evaluationParameters.length;
  const completionPercentage = (scoredParameters / totalParameters) * 100;
  
  // Calcular puntuación actual
  const currentTotal = evaluationParameters
    .filter(p => p.is_scored && p.current_score !== undefined)
    .reduce((sum, p) => sum + (p.current_score! * p.coefficient), 0);
  
  const maxPossibleTotal = evaluationParameters
    .reduce((sum, p) => sum + (p.max_score * p.coefficient), 0);
  
  const currentPercentage = maxPossibleTotal > 0 ? (currentTotal / maxPossibleTotal) * 100 : 0;

  const handleParameterChange = (direction: 'next' | 'prev') => {
    setIsAnimating(true);
    setTimeout(() => {
      if (direction === 'next' && currentParameterIndex < evaluationParameters.length - 1) {
        setCurrentParameterIndex(currentParameterIndex + 1);
      } else if (direction === 'prev' && currentParameterIndex > 0) {
        setCurrentParameterIndex(currentParameterIndex - 1);
      }
      setIsAnimating(false);
    }, 150);
  };

  const handleParticipantChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentParticipantIndex < participants.length - 1) {
      onParticipantChange(currentParticipantIndex + 1);
    } else if (direction === 'prev' && currentParticipantIndex > 0) {
      onParticipantChange(currentParticipantIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header Premium */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-amber-800 text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Trophy className="h-8 w-8 text-amber-300" />
              <div>
                <h1 className="text-2xl font-bold">{competitionName}</h1>
                <p className="text-blue-200">{categoryName}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-blue-200">Participante</p>
                <p className="text-xl font-bold">
                  {currentParticipantIndex + 1} / {participants.length}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-blue-200">Progreso</p>
                <p className="text-xl font-bold">
                  {Math.round(completionPercentage)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Panel de Participante - Diseño Magazine */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ParticipantCard
                participant={currentParticipant}
                currentScore={currentPercentage}
                maxScore={100}
                onPrevious={() => handleParticipantChange('prev')}
                onNext={() => handleParticipantChange('next')}
                canGoPrevious={currentParticipantIndex > 0}
                canGoNext={currentParticipantIndex < participants.length - 1}
              />
            </motion.div>

            {/* Progress Tracker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6"
            >
              <ProgressTracker
                totalParameters={totalParameters}
                scoredParameters={scoredParameters}
                currentParameter={currentParameterIndex}
                parameters={evaluationParameters}
                onParameterClick={setCurrentParameterIndex}
              />
            </motion.div>
          </div>

          {/* Panel de Calificación Principal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Parámetro Actual */}
            <motion.div
              key={currentParameterIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Target className="h-6 w-6" />
                      <div>
                        <h3 className="text-xl font-bold">{currentParameter.name}</h3>
                        <p className="text-blue-100 text-sm">{currentParameter.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-amber-500 text-white">
                        Coeficiente: {currentParameter.coefficient}
                      </Badge>
                      <Badge variant="secondary" className="bg-green-500 text-white">
                        Máx: {currentParameter.max_score}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-8">
                  <PremiumScoreInput
                    parameter={currentParameter}
                    participant={currentParticipant}
                    onScoreUpdate={(score, justification) => 
                      onScoreUpdate(currentParticipant.id, currentParameter.id, score, justification)
                    }
                    disabled={isAnimating}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Navegación de Parámetros */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleParameterChange('prev')}
                disabled={currentParameterIndex === 0 || isAnimating}
                className="flex items-center space-x-2 px-6 py-3 border-2 hover:border-blue-500 hover:bg-blue-50"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Parámetro Anterior</span>
              </Button>

              <div className="flex items-center space-x-2 bg-white rounded-lg px-4 py-2 shadow-md">
                <span className="text-sm text-gray-600">Parámetro</span>
                <Badge variant="default" className="bg-blue-600">
                  {currentParameterIndex + 1} / {totalParameters}
                </Badge>
              </div>

              <Button
                size="lg"
                onClick={() => handleParameterChange('next')}
                disabled={currentParameterIndex === evaluationParameters.length - 1 || isAnimating}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <span>Siguiente Parámetro</span>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Resumen de Puntuación */}
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Star className="h-5 w-5 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold text-amber-800">
                      {Math.round(currentPercentage)}%
                    </p>
                    <p className="text-sm text-amber-600">Puntuación Actual</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Award className="h-5 w-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-800">
                      {scoredParameters}
                    </p>
                    <p className="text-sm text-green-600">Ejercicios Completados</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-800">
                      {totalParameters - scoredParameters}
                    </p>
                    <p className="text-sm text-blue-600">Restantes</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-800">
                      {Math.round(completionPercentage)}%
                    </p>
                    <p className="text-sm text-purple-600">Progreso Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}