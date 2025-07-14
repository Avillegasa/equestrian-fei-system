// frontend/src/components/scoring/ProgressTracker.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  Target,
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

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

interface ProgressTrackerProps {
  totalParameters: number;
  scoredParameters: number;
  currentParameter: number;
  parameters: EvaluationParameter[];
  onParameterClick: (index: number) => void;
}

export function ProgressTracker({
  totalParameters,
  scoredParameters,
  currentParameter,
  parameters,
  onParameterClick
}: ProgressTrackerProps) {
  const completionPercentage = (scoredParameters / totalParameters) * 100;
  
  const getParameterStatus = (param: EvaluationParameter, index: number) => {
    if (param.is_scored) return 'completed';
    if (index === currentParameter) return 'current';
    if (index < currentParameter) return 'skipped';
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'current':
        return <Target className="h-5 w-5 text-blue-600" />;
      case 'skipped':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'current':
        return 'bg-blue-50 border-blue-300 hover:bg-blue-100';
      case 'skipped':
        return 'bg-amber-50 border-amber-200 hover:bg-amber-100';
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <TrendingUp className="h-5 w-5" />
          <span>Progreso de Evaluación</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Progress Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-green-600">{scoredParameters}</p>
            <p className="text-xs text-gray-600">Completados</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-blue-600">{totalParameters - scoredParameters}</p>
            <p className="text-xs text-gray-600">Restantes</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-purple-600">{Math.round(completionPercentage)}%</p>
            <p className="text-xs text-gray-600">Progreso</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progreso Total</span>
            <span className="font-medium text-gray-800">{Math.round(completionPercentage)}%</span>
          </div>
          <div className="relative">
            <Progress 
              value={completionPercentage} 
              className="h-3 bg-gray-200"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent h-3 rounded-full animate-pulse"
            />
          </div>
        </div>

        {/* Parameters List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Parámetros de Evaluación</h4>
          
          {parameters.map((param, index) => {
            const status = getParameterStatus(param, index);
            
            return (
              <motion.div
                key={param.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="ghost"
                  onClick={() => onParameterClick(index)}
                  className={`w-full justify-start text-left p-3 h-auto ${getStatusColor(status)} border transition-all duration-200`}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className="flex-shrink-0">
                      {getStatusIcon(status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">
                          {param.name}
                        </p>
                        <div className="flex items-center space-x-1 ml-2">
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-white/50"
                          >
                            ×{param.coefficient}
                          </Badge>
                          {param.is_scored && param.current_score !== undefined && (
                            <Badge 
                              variant="default" 
                              className="text-xs bg-green-600 text-white"
                            >
                              {param.current_score.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {param.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {param.description}
                        </p>
                      )}
                      
                      {status === 'current' && (
                        <div className="flex items-center space-x-1 mt-2">
                          <Clock className="h-3 w-3 text-blue-500" />
                          <span className="text-xs text-blue-600 font-medium">
                            Evaluando ahora
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
              <p className="text-lg font-bold text-green-700">
                {parameters.filter(p => p.needs_justification).length}
              </p>
              <p className="text-xs text-green-600">Con Justificación</p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
              <p className="text-lg font-bold text-blue-700">
                {parameters.reduce((sum, p) => sum + p.coefficient, 0)}
              </p>
              <p className="text-xs text-blue-600">Coef. Total</p>
            </div>
          </div>
        </div>

        {/* Time Estimate */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">
                Tiempo Estimado Restante
              </span>
            </div>
            <span className="text-sm text-purple-700">
              {Math.ceil((totalParameters - scoredParameters) * 2)} min
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}