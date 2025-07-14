// frontend/src/app/test/scoring-premium/page.tsx
'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PremiumScoringPanel } from '@/components/scoring/PremiumScoringPanel';
import { 
  mockScoringSession, 
  mockParticipants, 
  mockEvaluationParameters,
  mockScoringApi 
} from '@/lib/test-data/premium-scoring-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Toaster } from 'sonner';
import { toast } from 'sonner';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings,
  Users,
  Trophy,
  Clock
} from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function TestingScoringContent() {
  // Estados para la demostración
  const [participants, setParticipants] = useState(mockParticipants);
  const [evaluationParameters, setEvaluationParameters] = useState(mockEvaluationParameters);
  const [currentParticipantIndex, setCurrentParticipantIndex] = useState(0);
  const [isTestingMode, setIsTestingMode] = useState(true);
  const [testScenario, setTestScenario] = useState<'basic' | 'advanced' | 'extreme'>('basic');

  // Simular actualización de puntuación
  const handleScoreUpdate = async (participantId: number, parameterId: number, score: number, justification?: string) => {
    console.log('🎯 Score Update:', { participantId, parameterId, score, justification });
    
    // Actualizar parámetros localmente
    setEvaluationParameters(prev => 
      prev.map(param => 
        param.id === parameterId 
          ? { 
              ...param, 
              current_score: score, 
              is_scored: true,
              needs_justification: score <= 3.0 || score >= 8.5,
              justification: justification 
            }
          : param
      )
    );

    // Simular API call
    try {
      await mockScoringApi.saveScore({
        participant_id: participantId,
        parameter_id: parameterId,
        score,
        justification
      });
      
      toast.success(`Puntuación ${score} guardada correctamente`);
    } catch (error) {
      toast.error('Error al guardar puntuación');
    }
  };

  // Cambiar participante
  const handleParticipantChange = (index: number) => {
    setCurrentParticipantIndex(index);
    toast.info(`Cambiando a participante: ${participants[index]?.rider_name}`);
  };

  // Resetear datos de prueba
  const resetTestData = () => {
    setEvaluationParameters(mockEvaluationParameters.map(param => ({
      ...param,
      current_score: undefined,
      is_scored: false,
      needs_justification: false,
      justification: undefined
    })));
    setCurrentParticipantIndex(0);
    toast.info('Datos de prueba reiniciados');
  };

  // Simular diferentes escenarios
  const loadTestScenario = (scenario: 'basic' | 'advanced' | 'extreme') => {
    setTestScenario(scenario);
    
    switch (scenario) {
      case 'basic':
        // Algunos parámetros completados con puntuaciones normales
        setEvaluationParameters(prev => prev.map((param, index) => 
          index < 3 ? {
            ...param,
            current_score: 6.5 + (Math.random() * 2),
            is_scored: true,
            needs_justification: false
          } : {
            ...param,
            current_score: undefined,
            is_scored: false,
            needs_justification: false
          }
        ));
        break;
        
      case 'advanced':
        // Mezcla de puntuaciones altas y medias
        setEvaluationParameters(prev => prev.map((param, index) => 
          index < 5 ? {
            ...param,
            current_score: 7.0 + (Math.random() * 2.5),
            is_scored: true,
            needs_justification: false
          } : {
            ...param,
            current_score: undefined,
            is_scored: false,
            needs_justification: false
          }
        ));
        break;
        
      case 'extreme':
        // Incluir puntuaciones extremas que requieren justificación
        setEvaluationParameters(prev => prev.map((param, index) => {
          const score = index === 0 ? 2.5 : index === 1 ? 9.0 : 7.0 + (Math.random() * 1.5);
          return index < 6 ? {
            ...param,
            current_score: score,
            is_scored: true,
            needs_justification: score <= 3.0 || score >= 8.5,
            justification: score <= 3.0 ? 'Caballo mostró resistencia significativa' : 
                          score >= 8.5 ? 'Ejecución prácticamente perfecta' : undefined
          } : {
            ...param,
            current_score: undefined,
            is_scored: false,
            needs_justification: false
          };
        }));
        break;
    }
    
    toast.success(`Escenario "${scenario}" cargado`);
  };

  // Calcular estadísticas
  const scoredCount = evaluationParameters.filter(p => p.is_scored).length;
  const totalCount = evaluationParameters.length;
  const completionPercentage = totalCount > 0 ? (scoredCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Panel de Control de Testing */}
      {isTestingMode && (
        <div className="fixed top-4 right-4 z-50 w-80">
          <Card className="shadow-lg border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Panel de Testing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white rounded p-2">
                  <div className="text-lg font-bold text-blue-600">{scoredCount}</div>
                  <div className="text-xs text-gray-600">Completados</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-lg font-bold text-green-600">{Math.round(completionPercentage)}%</div>
                  <div className="text-xs text-gray-600">Progreso</div>
                </div>
                <div className="bg-white rounded p-2">
                  <div className="text-lg font-bold text-purple-600">{currentParticipantIndex + 1}</div>
                  <div className="text-xs text-gray-600">Participante</div>
                </div>
              </div>

              {/* Escenarios de Prueba */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Escenarios de Prueba:</div>
                <div className="grid grid-cols-3 gap-1">
                  <Button 
                    size="sm"
                    variant={testScenario === 'advanced' ? 'default' : 'outline'}
                    onClick={() => loadTestScenario('advanced')}
                    className="text-xs"
                  >
                    Avanzado
                  </Button>
                  <Button 
                    size="sm"
                    variant={testScenario === 'extreme' ? 'default' : 'outline'}
                    onClick={() => loadTestScenario('extreme')}
                    className="text-xs"
                  >
                    Extremo
                  </Button>
                </div>
              </div>

              {/* Controles */}
              <div className="space-y-2">
                <Button 
                  onClick={resetTestData} 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Resetear Datos
                </Button>
                
                <Button 
                  onClick={() => setIsTestingMode(false)} 
                  size="sm" 
                  variant="ghost" 
                  className="w-full"
                >
                  Ocultar Panel
                </Button>
              </div>

              {/* Info del participante actual */}
              <div className="bg-white rounded p-2 text-xs">
                <div className="font-medium text-gray-800">
                  {participants[currentParticipantIndex]?.rider_name}
                </div>
                <div className="text-gray-600">
                  {participants[currentParticipantIndex]?.horse_name}
                </div>
                <div className="text-gray-500">
                  #{participants[currentParticipantIndex]?.participant_number}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botón para mostrar panel si está oculto */}
      {!isTestingMode && (
        <Button 
          onClick={() => setIsTestingMode(true)}
          className="fixed top-4 right-4 z-50"
          size="sm"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}

      {/* Componente Principal */}
      <PremiumScoringPanel
        participants={participants}
        currentParticipantIndex={currentParticipantIndex}
        evaluationParameters={evaluationParameters}
        onScoreUpdate={handleScoreUpdate}
        onParticipantChange={handleParticipantChange}
        competitionName={mockScoringSession.competition_name}
        categoryName={mockScoringSession.category_name}
      />

      {/* Toaster para notificaciones */}
      <Toaster 
        position="bottom-right"
        expand={false}
        richColors
        closeButton
      />
    </div>
  );
}

// Componente principal con QueryClient
export default function TestPremiumScoringPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        {/* Header de Testing */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">🧪 Testing: Calificación Premium</h1>
                <p className="text-blue-100">Subfase 6.5.3 - Interfaces de Calificación</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="bg-white/20 text-white">
                  <Trophy className="h-3 w-3 mr-1" />
                  FEI System
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  <Users className="h-3 w-3 mr-1" />
                  4 Participantes
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  <Clock className="h-3 w-3 mr-1" />
                  Demo Mode
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <TestingScoringContent />
      </div>
    </QueryClientProvider>
  );
}