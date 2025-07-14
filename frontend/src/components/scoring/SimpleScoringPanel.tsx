// src/components/scoring/SimpleScoringPanel.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Star, Save } from 'lucide-react';

interface Participant {
  id: number;
  rider_name: string;
  horse_name: string;
  participant_number: string;
  category: string;
  nationality?: string;
}

interface EvaluationParameter {
  id: number;
  name: string;
  description: string;
  coefficient: number;
  max_score: number;
  current_score?: number;
  is_scored: boolean;
}

interface SimpleScoringPanelProps {
  participants: Participant[];
  currentParticipantIndex: number;
  evaluationParameters: EvaluationParameter[];
  onScoreUpdate: (participantId: number, parameterId: number, score: number, justification?: string) => void;
  onParticipantChange: (index: number) => void;
  competitionName: string;
  categoryName: string;
}

export function SimpleScoringPanel({
  participants,
  currentParticipantIndex,
  evaluationParameters,
  onScoreUpdate,
  onParticipantChange,
  competitionName,
  categoryName
}: SimpleScoringPanelProps) {
  const [currentParameterIndex, setCurrentParameterIndex] = useState(0);
  const [tempScore, setTempScore] = useState<string>('');
  const [justification, setJustification] = useState<string>('');

  const currentParticipant = participants[currentParticipantIndex];
  const currentParameter = evaluationParameters[currentParameterIndex];
  
  // Calcular progreso
  const completedCount = evaluationParameters.filter(p => p.is_scored).length;
  const totalCount = evaluationParameters.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Calcular puntuación total
  const totalScore = evaluationParameters
    .filter(p => p.is_scored && p.current_score)
    .reduce((sum, p) => sum + (p.current_score! * p.coefficient), 0);

  const maxPossible = evaluationParameters
    .reduce((sum, p) => sum + (p.max_score * p.coefficient), 0);

  const percentage = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;

  const handleScoreSubmit = () => {
    const score = parseFloat(tempScore);
    if (isNaN(score) || score < 0 || score > currentParameter.max_score) {
      alert(`Puntuación debe estar entre 0 y ${currentParameter.max_score}`);
      return;
    }

    if (score % 0.5 !== 0) {
      alert('La puntuación debe ser en incrementos de 0.5');
      return;
    }

    const needsJustification = score <= 3.0 || score >= 8.5;
    if (needsJustification && !justification.trim()) {
      alert('Esta puntuación requiere justificación');
      return;
    }

    onScoreUpdate(currentParticipant.id, currentParameter.id, score, justification || undefined);
    setTempScore('');
    setJustification('');
    
    // Avanzar al siguiente parámetro
    if (currentParameterIndex < evaluationParameters.length - 1) {
      setCurrentParameterIndex(currentParameterIndex + 1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      
      {/* Header de competencia */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold">{competitionName}</h1>
          <p className="text-blue-100">{categoryName}</p>
        </CardContent>
      </Card>

      {/* Info del participante */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => onParticipantChange(Math.max(0, currentParticipantIndex - 1))}
                disabled={currentParticipantIndex === 0}
                variant="outline"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl font-bold text-blue-600">
                    #{currentParticipant.participant_number}
                  </span>
                </div>
                <h2 className="text-xl font-bold">{currentParticipant.rider_name}</h2>
                <p className="text-gray-600">{currentParticipant.horse_name}</p>
                {currentParticipant.nationality && (
                  <Badge variant="outline" className="mt-1">
                    {currentParticipant.nationality}
                  </Badge>
                )}
              </div>

              <Button
                onClick={() => onParticipantChange(Math.min(participants.length - 1, currentParticipantIndex + 1))}
                disabled={currentParticipantIndex === participants.length - 1}
                variant="outline"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-600">Participante</div>
              <div className="text-2xl font-bold">{currentParticipantIndex + 1} / {participants.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progreso general */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completedCount}</div>
              <div className="text-sm text-gray-600">Ejercicios Completados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{percentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Puntuación Actual</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{progressPercentage.toFixed(0)}%</div>
              <div className="text-sm text-gray-600">Progreso Total</div>
            </div>
          </div>
          <Progress value={progressPercentage} className="mt-4" />
        </CardContent>
      </Card>

      {/* Parámetro actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{currentParameter.name}</span>
            <div className="flex items-center space-x-2">
              <Badge>Coef. {currentParameter.coefficient}</Badge>
              <Badge variant="outline">Máx. {currentParameter.max_score}</Badge>
            </div>
          </CardTitle>
          <p className="text-gray-600">{currentParameter.description}</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Input de puntuación */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Puntuación (0.0 - {currentParameter.max_score})
            </label>
            <Input
              type="number"
              min="0"
              max={currentParameter.max_score}
              step="0.5"
              value={tempScore}
              onChange={(e) => setTempScore(e.target.value)}
              placeholder="Ej: 7.5"
              className="text-lg font-bold text-center"
            />
          </div>

          {/* Justificación */}
          {parseFloat(tempScore) <= 3.0 || parseFloat(tempScore) >= 8.5 ? (
            <div>
              <label className="block text-sm font-medium mb-2 text-amber-600">
                <Star className="h-4 w-4 inline mr-1" />
                Justificación requerida (puntuación extrema)
              </label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explique el motivo de esta puntuación..."
                className="min-h-[80px]"
              />
            </div>
          ) : null}

          {/* Botón de guardar */}
          <Button
            onClick={handleScoreSubmit}
            disabled={!tempScore}
            className="w-full"
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            Confirmar Puntuación
          </Button>

          {/* Navegación de parámetros */}
          <div className="flex justify-between pt-4">
            <Button
              onClick={() => setCurrentParameterIndex(Math.max(0, currentParameterIndex - 1))}
              disabled={currentParameterIndex === 0}
              variant="outline"
            >
              Parámetro Anterior
            </Button>
            
            <span className="text-sm text-gray-600 self-center">
              {currentParameterIndex + 1} / {evaluationParameters.length}
            </span>
            
            <Button
              onClick={() => setCurrentParameterIndex(Math.min(evaluationParameters.length - 1, currentParameterIndex + 1))}
              disabled={currentParameterIndex === evaluationParameters.length - 1}
              variant="outline"
            >
              Siguiente Parámetro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de parámetros */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Evaluación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {evaluationParameters.map((param, index) => (
              <div 
                key={param.id}
                className={`flex items-center justify-between p-3 rounded border ${
                  index === currentParameterIndex ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                } ${param.is_scored ? 'bg-green-50' : ''}`}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{param.name}</div>
                  <div className="text-xs text-gray-600">Coef. {param.coefficient}</div>
                </div>
                <div className="text-right">
                  {param.is_scored ? (
                    <Badge variant="default" className="bg-green-600">
                      {param.current_score?.toFixed(1)}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Pendiente</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}