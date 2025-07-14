// frontend/src/components/scoring/PremiumScoreInput.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Star,
  Minus,
  Plus,
  RotateCcw,
  MessageSquare,
  TrendingUp,
  TrendingDown
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

interface Participant {
  id: number;
  rider_name: string;
  horse_name: string;
  participant_number: string;
}

interface PremiumScoreInputProps {
  parameter: EvaluationParameter;
  participant: Participant;
  onScoreUpdate: (score: number, justification?: string) => void;
  disabled?: boolean;
}

const QUICK_SCORES = [
  { value: 4.0, label: "4.0", color: "bg-red-500", description: "Insuficiente" },
  { value: 5.0, label: "5.0", color: "bg-orange-500", description: "Suficiente" },
  { value: 6.0, label: "6.0", color: "bg-yellow-500", description: "Satisfactorio" },
  { value: 7.0, label: "7.0", color: "bg-lime-500", description: "Bueno" },
  { value: 8.0, label: "8.0", color: "bg-green-500", description: "Muy Bueno" },
  { value: 9.0, label: "9.0", color: "bg-emerald-500", description: "Excelente" },
  { value: 10.0, label: "10.0", color: "bg-blue-500", description: "Perfecto" }
];

export function PremiumScoreInput({
  parameter,
  participant,
  onScoreUpdate,
  disabled = false
}: PremiumScoreInputProps) {
  const [currentScore, setCurrentScore] = useState<number>(parameter.current_score || 0);
  const [justification, setJustification] = useState<string>('');
  const [showJustification, setShowJustification] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [animatingScore, setAnimatingScore] = useState(false);

  // Validación de puntuación
  const validateScore = (score: number): string => {
    if (score < 0 || score > parameter.max_score) {
      return `La puntuación debe estar entre 0 y ${parameter.max_score}`;
    }
    if (score % 0.5 !== 0) {
      return 'La puntuación debe ser en incrementos de 0.5';
    }
    if (score <= 3.0 || score >= 8.5) {
      return 'Puntuaciones extremas requieren justificación';
    }
    return '';
  };

  // Determinar si necesita justificación
  const needsJustification = (score: number): boolean => {
    return score <= 3.0 || score >= 8.5;
  };

  // Calcular color según puntuación
  const getScoreColor = (score: number): string => {
    if (score >= 9) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 7) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 6) return 'text-lime-600 bg-lime-50 border-lime-200';
    if (score >= 5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 4) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const handleScoreChange = (newScore: number) => {
    setAnimatingScore(true);
    setCurrentScore(newScore);
    const validation = validateScore(newScore);
    setValidationMessage(validation);
    
    if (needsJustification(newScore)) {
      setShowJustification(true);
    } else {
      setShowJustification(false);
      setJustification('');
    }

    setTimeout(() => setAnimatingScore(false), 300);
  };

  const handleSubmitScore = () => {
    const validation = validateScore(currentScore);
    if (validation && !validation.includes('justificación')) {
      return; // No enviar si hay errores de validación
    }

    if (needsJustification(currentScore) && !justification.trim()) {
      setValidationMessage('Se requiere justificación para esta puntuación');
      return;
    }

    onScoreUpdate(currentScore, justification || undefined);
  };

  const incrementScore = () => {
    const newScore = Math.min(parameter.max_score, currentScore + 0.5);
    handleScoreChange(newScore);
  };

  const decrementScore = () => {
    const newScore = Math.max(0, currentScore - 0.5);
    handleScoreChange(newScore);
  };

  const resetScore = () => {
    handleScoreChange(0);
    setJustification('');
    setShowJustification(false);
  };

  return (
    <div className="space-y-6">
      {/* Score Display Principal */}
      <div className="text-center">
        <motion.div
          animate={{ 
            scale: animatingScore ? 1.1 : 1,
            rotate: animatingScore ? [0, 5, -5, 0] : 0
          }}
          transition={{ duration: 0.3 }}
          className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreColor(currentScore)} text-4xl font-bold shadow-lg`}
        >
          {currentScore.toFixed(1)}
        </motion.div>
        
        <div className="mt-4">
          <p className="text-lg text-gray-600">
            Puntuación de <span className="font-semibold">{parameter.name}</span>
          </p>
          <p className="text-sm text-gray-500">
            para {participant.rider_name} • #{participant.participant_number}
          </p>
        </div>
      </div>

      {/* Quick Score Buttons */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 text-center">Puntuaciones Rápidas</h4>
        <div className="grid grid-cols-7 gap-2">
          {QUICK_SCORES.map((quickScore) => (
            <motion.div
              key={quickScore.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant={currentScore === quickScore.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleScoreChange(quickScore.value)}
                disabled={disabled}
                className={`h-16 flex flex-col justify-center space-y-1 ${
                  currentScore === quickScore.value 
                    ? `${quickScore.color} text-white border-0` 
                    : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-lg font-bold">{quickScore.label}</span>
                <span className="text-xs opacity-80">{quickScore.description}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Score Adjustment Controls */}
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="lg"
          onClick={decrementScore}
          disabled={disabled || currentScore <= 0}
          className="h-12 w-12 rounded-full border-2 hover:border-red-400 hover:bg-red-50"
        >
          <Minus className="h-5 w-5" />
        </Button>

        <div className="flex items-center space-x-2 bg-white rounded-lg border-2 px-4 py-2">
          <Input
            type="number"
            min="0"
            max={parameter.max_score}
            step="0.5"
            value={currentScore}
            onChange={(e) => handleScoreChange(parseFloat(e.target.value) || 0)}
            disabled={disabled}
            className="w-20 text-center text-lg font-bold border-0 bg-transparent"
          />
          <span className="text-gray-500">/ {parameter.max_score}</span>
        </div>

        <Button
          variant="outline"
          size="lg"
          onClick={incrementScore}
          disabled={disabled || currentScore >= parameter.max_score}
          className="h-12 w-12 rounded-full border-2 hover:border-green-400 hover:bg-green-50"
        >
          <Plus className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={resetScore}
          disabled={disabled}
          className="h-12 w-12 rounded-full border-2 hover:border-gray-400 hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Weighted Score Display */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Puntuación Ponderada</span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-900">
              {(currentScore * parameter.coefficient).toFixed(1)}
            </p>
            <p className="text-xs text-blue-600">
              {currentScore.toFixed(1)} × {parameter.coefficient} (coeficiente)
            </p>
          </div>
        </div>
      </div>

      {/* Validation Messages */}
      <AnimatePresence>
        {validationMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert className={validationMessage.includes('justificación') ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {validationMessage}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Justification Section */}
      <AnimatePresence>
        {showJustification && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-amber-600" />
              <h4 className="font-medium text-amber-800">Justificación Requerida</h4>
            </div>
            
            <Textarea
              placeholder="Explique el motivo de esta puntuación extrema..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              disabled={disabled}
              className="min-h-[100px] border-amber-200 focus:border-amber-400"
            />
            
            <div className="text-xs text-amber-600">
              Las puntuaciones ≤3.0 o ≥8.5 requieren justificación según el reglamento FEI
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          onClick={handleSubmitScore}
          disabled={disabled || (needsJustification(currentScore) && !justification.trim())}
          className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          Confirmar Puntuación
        </Button>

        {parameter.is_scored && (
          <Badge variant="secondary" className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <span>Calificado</span>
          </Badge>
        )}
      </div>

      {/* Score Trend Indicator */}
      {parameter.current_score !== undefined && currentScore !== parameter.current_score && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center space-x-2 text-sm"
        >
          {currentScore > parameter.current_score ? (
            <>
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600">
                +{(currentScore - parameter.current_score).toFixed(1)} puntos
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-red-600">
                {(currentScore - parameter.current_score).toFixed(1)} puntos
              </span>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}