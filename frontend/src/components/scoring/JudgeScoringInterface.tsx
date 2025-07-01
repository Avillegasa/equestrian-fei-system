'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle,
  Timer,
  Calculator,
  Eye,
  EyeOff,
  Target
} from 'lucide-react';
import { useJudgeScorecard, useParticipantNavigation, useRealtimeCalculations } from '@/hooks/useScoring';
import { ScoreInputGrid } from './ScoreInputGrid';
import { ParticipantInfo } from './ParticipantInfo';
import { ScoringProgressBar } from './ScoringProgressBar';
import { ScoreTotalsDisplay } from './ScoreTotalsDisplay';
import type { Participant, JudgePosition } from '@/types/scoring';

interface JudgeScoringInterfaceProps {
  participants: Participant[];
  judgePosition: JudgePosition;
  competitionId: number;
  onComplete?: () => void;
  onParticipantChange?: (participantId: number) => void;
}

export function JudgeScoringInterface({
  participants,
  judgePosition,
  competitionId,
  onComplete,
  onParticipantChange
}: JudgeScoringInterfaceProps) {
  // Navegación entre participantes
  const participantIds = participants.map(p => p.id);
  const {
    currentParticipantId,
    currentIndex,
    totalParticipants,
    goToNext,
    goToPrevious,
    goToParticipant,
    canGoNext,
    canGoPrevious
  } = useParticipantNavigation(participantIds);

  // Datos de la tarjeta de puntuación actual
  const {
    scorecard,
    isLoading,
    error,
    updateScore,
    scheduleAutoSave,
    refetch
  } = useJudgeScorecard(currentParticipantId, judgePosition.id);

  // Cálculos en tiempo real
  const {
    livePercentage,
    liveTotal,
    completionRate
  } = useRealtimeCalculations(scorecard);

  // Estado local
  const [showLiveTotals, setShowLiveTotals] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Participante actual
  const currentParticipant = participants.find(p => p.id === currentParticipantId);

  // Efectos
  useEffect(() => {
    onParticipantChange?.(currentParticipantId);
  }, [currentParticipantId, onParticipantChange]);

  // Manejar actualización de puntuación
  const handleScoreUpdate = useCallback(async (
    evaluationParameterId: number,
    score: number,
    justification?: string
  ) => {
    try {
      setUnsavedChanges(true);
      
      if (autoSaveEnabled) {
        await updateScore(evaluationParameterId, score, justification);
        setLastSaved(new Date());
        setUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error updating score:', error);
      // El error será manejado por el hook
    }
  }, [updateScore, autoSaveEnabled]);

  // Guardar manualmente
  const handleManualSave = useCallback(async () => {
    if (!unsavedChanges) return;
    
    try {
      await refetch();
      setLastSaved(new Date());
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving scorecard:', error);
    }
  }, [refetch, unsavedChanges]);

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'ArrowRight':
            event.preventDefault();
            if (canGoNext) goToNext();
            break;
          case 'ArrowLeft':
            event.preventDefault();
            if (canGoPrevious) goToPrevious();
            break;
          case 's':
            event.preventDefault();
            handleManualSave();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoNext, canGoPrevious, goToNext, goToPrevious, handleManualSave]);

  // Verificar si la evaluación está completa
  const isEvaluationComplete = scorecard?.scorecard.every(entry => entry.is_scored) || false;

  // Renderizado
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tarjeta de puntuación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error cargando la tarjeta de puntuación: {error.message}
          <Button onClick={refetch} variant="outline" size="sm" className="ml-2">
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!scorecard || !currentParticipant) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No se encontraron datos para este participante.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header con información del juez y controles */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Panel de Calificación - Posición {judgePosition.position}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Juez: {judgePosition.judge_name}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Toggle de totales en vivo */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLiveTotals(!showLiveTotals)}
              >
                {showLiveTotals ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showLiveTotals ? 'Ocultar' : 'Mostrar'} Totales
              </Button>

              {/* Auto-save toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              >
                <Timer className="h-4 w-4 mr-1" />
                Auto-guardado: {autoSaveEnabled ? 'ON' : 'OFF'}
              </Button>

              {/* Guardar manual */}
              {!autoSaveEnabled && (
                <Button
                  onClick={handleManualSave}
                  disabled={!unsavedChanges}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Guardar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Navegación de participantes */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={!canGoPrevious}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Participante {currentIndex + 1} de {totalParticipants}
              </p>
              <Progress value={(currentIndex / totalParticipants) * 100} className="w-32 mt-1" />
            </div>

            <Button
              variant="outline"
              onClick={goToNext}
              disabled={!canGoNext}
              className="flex items-center gap-2"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Información del participante */}
      <ParticipantInfo 
        participant={currentParticipant}
        isComplete={isEvaluationComplete}
        completionRate={completionRate}
      />

      {/* Advertencias y alertas */}
      {unsavedChanges && !autoSaveEnabled && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tienes cambios sin guardar. Presiona Ctrl+S o haz clic en "Guardar" para guardar los cambios.
          </AlertDescription>
        </Alert>
      )}

      {/* Totales en tiempo real */}
      {showLiveTotals && (
        <ScoreTotalsDisplay
          livePercentage={livePercentage}
          liveTotal={liveTotal}
          totalPossible={scorecard.totals.total_possible_score}
          completionRate={completionRate}
          isComplete={isEvaluationComplete}
        />
      )}

      {/* Grid principal de puntuación */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Ejercicios de Evaluación FEI
            </CardTitle>
            
            {/* Progress bar detallado */}
            <ScoringProgressBar
              totalExercises={scorecard.scorecard.length}
              completedExercises={scorecard.scorecard.filter(e => e.is_scored).length}
              showPercentage
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <ScoreInputGrid
            scorecard={scorecard}
            onScoreUpdate={handleScoreUpdate}
            disabled={isLoading}
            showValidation
            highlightExtreme
          />
        </CardContent>
      </Card>

      {/* Panel de estado y resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado de la evaluación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Estado de la Evaluación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Progreso:</span>
                <Badge variant={isEvaluationComplete ? "default" : "secondary"}>
                  {completionRate.toFixed(0)}%
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ejercicios:</span>
                <span className="text-sm font-medium">
                  {scorecard.scorecard.filter(e => e.is_scored).length} / {scorecard.scorecard.length}
                </span>
              </div>

              {isEvaluationComplete && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Evaluación Completa</span>
                </div>
              )}

              {lastSaved && (
                <div className="text-xs text-gray-500">
                  Último guardado: {lastSaved.toLocaleTimeString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navegación rápida */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Navegación Rápida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {participants.slice(Math.max(0, currentIndex - 2), currentIndex + 3).map((participant, idx) => {
                const globalIndex = Math.max(0, currentIndex - 2) + idx;
                const isCurrent = participant.id === currentParticipantId;
                
                return (
                  <Button
                    key={participant.id}
                    variant={isCurrent ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToParticipant(participant.id)}
                    className="text-xs"
                  >
                    #{participant.number} {participant.rider.first_name}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atajos de teclado */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="text-xs text-gray-500 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium">Ctrl + →</span>
              <br />Siguiente participante
            </div>
            <div>
              <span className="font-medium">Ctrl + ←</span>
              <br />Participante anterior
            </div>
            <div>
              <span className="font-medium">Ctrl + S</span>
              <br />Guardar cambios
            </div>
            <div>
              <span className="font-medium">Tab / Enter</span>
              <br />Navegar ejercicios
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}