// 🏆 Dashboard Premium FEI - Ejemplo del Sistema de Diseño Renovado
// Demostrando la aplicación completa del nuevo sistema visual

import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  Badge, 
  Progress, 
  Alert, 
  RankingPosition,
  Skeleton,
  Notification
} from './ui-components-premium';
import { 
  EquestrianIcons, 
  ConnectivityIcon, 
  ScoreStatusIcon,
  RankingPositionIcon,
  LoadingIcon
} from './equestrian-icons';
import { cn, formatFEIScore, formatFEIPercentage, getRelativeTime } from './utils';

// === TIPOS ===
interface CompetitionMetrics {
  activeCompetitions: number;
  totalParticipants: number;
  completedScores: number;
  averageScore: number;
  onlineJudges: number;
  pendingSync: number;
}

interface RecentActivity {
  id: string;
  type: 'score_update' | 'ranking_change' | 'judge_login' | 'sync_complete';
  description: string;
  timestamp: Date;
  participant?: string;
  score?: number;
}

// === DASHBOARD PREMIUM PRINCIPAL ===
export const DashboardPremium: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [metrics, setMetrics] = useState<CompetitionMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  // Simular carga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      setMetrics({
        activeCompetitions: 3,
        totalParticipants: 42,
        completedScores: 156,
        averageScore: 7.8,
        onlineJudges: 8,
        pendingSync: 2
      });
      
      setRecentActivity([
        {
          id: '1',
          type: 'score_update',
          description: 'Nueva calificación registrada',
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          participant: 'María González - Tornado',
          score: 8.5
        },
        {
          id: '2',
          type: 'ranking_change',
          description: 'Cambio en ranking - Categoría Intermedia',
          timestamp: new Date(Date.now() - 5 * 60 * 1000)
        },
        {
          id: '3',
          type: 'judge_login',
          description: 'Juez conectado',
          timestamp: new Date(Date.now() - 10 * 60 * 1000)
        }
      ]);
      
      setLoading(false);
      setShowNotification(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header Premium */}
      <header className="bg-white shadow-soft border-b border-gray-200">
        <div className="container-responsive py-4">
          <div className="flex items-center justify-between">
            {/* Logo y título */}
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-xl bg-gradient-equestrian shadow-glow">
                <EquestrianIcons.FEILogo size={32} color="white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient-primary">
                  Sistema FEI Premium
                </h1>
                <p className="text-gray-600">
                  Gestión de Competencias Ecuestres
                </p>
              </div>
            </div>

            {/* Estado y acciones */}
            <div className="flex items-center space-x-4">
              <ConnectivityIcon 
                isOnline={isOnline} 
                showLabel 
                className="bg-white px-3 py-2 rounded-lg shadow-soft border border-gray-200"
              />
              
              <Button 
                variant="equestrian" 
                icon={<EquestrianIcons.Live size={18} />}
                className="shadow-glow"
              >
                Ver Rankings en Vivo
              </Button>
              
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-equestrian-gold-400 to-equestrian-gold-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">JA</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container-responsive py-8">
        
        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="card" className="h-32" />
            ))
          ) : (
            <>
              <MetricCard
                title="Competencias Activas"
                value={metrics?.activeCompetitions || 0}
                icon={<EquestrianIcons.Competition size={24} />}
                color="blue"
                trend="+2 esta semana"
              />
              
              <MetricCard
                title="Participantes Total"
                value={metrics?.totalParticipants || 0}
                icon={<EquestrianIcons.Rider size={24} />}
                color="green"
                trend="+8 nuevos hoy"
              />
              
              <MetricCard
                title="Puntuaciones Completadas"
                value={metrics?.completedScores || 0}
                icon={<EquestrianIcons.Score size={24} />}
                color="purple"
                trend={`Promedio: ${formatFEIScore(metrics?.averageScore || 0)}`}
              />
              
              <MetricCard
                title="Jueces en Línea"
                value={metrics?.onlineJudges || 0}
                icon={<EquestrianIcons.Judge size={24} />}
                color="orange"
                trend="8/10 conectados"
                animated
              />
            </>
          )}
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna izquierda - Rankings actuales */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Rankings en tiempo real */}
            <Card 
              variant="equestrian"
              header={
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <RankingPositionIcon position={1} size={40} animated />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Rankings en Tiempo Real
                      </h3>
                      <p className="text-gray-600">
                        Categoría Intermedia I - Actualizado hace 2 min
                      </p>
                    </div>
                  </div>
                  <Badge variant="success" icon={<EquestrianIcons.Live size={16} />}>
                    En Vivo
                  </Badge>
                </div>
              }
            >
              <div className="space-y-4">
                {[
                  { name: 'María González', horse: 'Tornado', score: 8.5, percentage: 85.0, position: 1 },
                  { name: 'Carlos Ruiz', horse: 'Estrella', score: 8.2, percentage: 82.0, position: 2 },
                  { name: 'Ana Martín', horse: 'Rayo', score: 7.9, percentage: 79.0, position: 3 },
                  { name: 'Luis Pérez', horse: 'Viento', score: 7.6, percentage: 76.0, position: 4 }
                ].map((participant) => (
                  <div 
                    key={participant.name}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:shadow-premium transition-all duration-200 animate-fade-in-up"
                  >
                    <div className="flex items-center space-x-4">
                      <RankingPositionIcon position={participant.position} size={36} />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {participant.name}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center space-x-2">
                          <EquestrianIcons.Horse size={16} />
                          <span>{participant.horse}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-3">
                        <ScoreStatusIcon score={participant.score} size={28} />
                        <div>
                          <div className="text-xl font-bold text-gray-900">
                            {formatFEIScore(participant.score)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatFEIPercentage(participant.percentage)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button variant="ghost" className="w-full">
                  Ver Ranking Completo
                  <EquestrianIcons.Ranking size={18} className="ml-2" />
                </Button>
              </div>
            </Card>

            {/* Progreso de competencias */}
            <Card
              header={
                <div className="flex items-center space-x-3">
                  <EquestrianIcons.Stats size={24} className="text-equestrian-blue-600" />
                  <h3 className="text-lg font-semibold">Progreso de Competencias</h3>
                </div>
              }
            >
              <div className="space-y-6">
                {[
                  { name: 'Categoría Intermedia I', completed: 85, total: 100, color: 'success' },
                  { name: 'Young Riders Individual', completed: 60, total: 80, color: 'equestrian' },
                  { name: 'Cuarto Nivel', completed: 45, total: 120, color: 'warning' }
                ].map((competition) => (
                  <div key={competition.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {competition.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        {competition.completed}/{competition.total}
                      </span>
                    </div>
                    <Progress
                      value={(competition.completed / competition.total) * 100}
                      variant={competition.color as any}
                      showPercentage
                      animated
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Columna derecha - Actividad y estado */}
          <div className="space-y-6">
            
            {/* Estado del sistema */}
            <Card
              variant="default"
              header={
                <div className="flex items-center space-x-3">
                  <EquestrianIcons.Sync size={24} className="text-equestrian-green-600" />
                  <h3 className="text-lg font-semibold">Estado del Sistema</h3>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Sincronización</span>
                  <Badge variant="success">Activa</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Base de Datos</span>
                  <Badge variant="success">Conectada</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">WebSockets</span>
                  <Badge variant="success">En Línea</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Pendientes Sync</span>
                  <Badge variant="warning">{metrics?.pendingSync || 0}</Badge>
                </div>
              </div>
              
              {metrics?.pendingSync > 0 && (
                <Alert 
                  variant="warning" 
                  title="Sincronización Pendiente"
                  className="mt-4"
                >
                  Hay {metrics.pendingSync} elementos esperando sincronización.
                </Alert>
              )}
            </Card>

            {/* Actividad reciente */}
            <Card
              header={
                <div className="flex items-center space-x-3">
                  <EquestrianIcons.Timer size={24} className="text-equestrian-gold-600" />
                  <h3 className="text-lg font-semibold">Actividad Reciente</h3>
                </div>
              }
            >
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      {activity.participant && (
                        <p className="text-sm text-gray-600 truncate">
                          {activity.participant}
                          {activity.score && (
                            <span className="ml-2 font-mono font-bold text-equestrian-green-600">
                              {formatFEIScore(activity.score)}
                            </span>
                          )}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {getRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button variant="ghost" size="sm" className="w-full">
                  Ver Toda la Actividad
                </Button>
              </div>
            </Card>

            {/* Acciones rápidas */}
            <Card
              header={
                <h3 className="text-lg font-semibold">Acciones Rápidas</h3>
              }
            >
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="primary" 
                  size="sm"
                  icon={<EquestrianIcons.Competition size={16} />}
                  className="flex-col h-16 text-xs"
                >
                  Nueva Competencia
                </Button>
                
                <Button 
                  variant="secondary" 
                  size="sm"
                  icon={<EquestrianIcons.Judge size={16} />}
                  className="flex-col h-16 text-xs"
                >
                  Asignar Juez
                </Button>
                
                <Button 
                  variant="success" 
                  size="sm"
                  icon={<EquestrianIcons.Rider size={16} />}
                  className="flex-col h-16 text-xs"
                >
                  Nuevo Participante
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  icon={<EquestrianIcons.Arena size={16} />}
                  className="flex-col h-16 text-xs"
                >
                  Configurar Arena
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Notificación de ejemplo */}
      {showNotification && (
        <Notification
          title="Sistema Actualizado"
          variant="success"
          position="top-right"
          onClose={() => setShowNotification(false)}
        >
          Dashboard cargado con éxito. Todas las métricas están actualizadas.
        </Notification>
      )}
    </div>
  );
};

// === COMPONENTE DE MÉTRICA ===
interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
  trend?: string;
  animated?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color,
  trend,
  animated = false
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-blue-600',
    green: 'from-green-500 to-green-600 text-green-600',
    purple: 'from-purple-500 to-purple-600 text-purple-600',
    orange: 'from-orange-500 to-orange-600 text-orange-600'
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center">
        <div className={cn(
          'p-3 rounded-xl bg-gradient-to-br shadow-lg',
          `from-${color}-500 to-${color}-600`
        )}>
          <div className={cn('text-white', animated && 'animate-pulse')}>
            {icon}
          </div>
        </div>
        
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">
            {title}
          </p>
          <p className={cn(
            'text-2xl font-bold',
            colorClasses[color].split(' ')[2]
          )}>
            {value}
          </p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1">
              {trend}
            </p>
          )}
        </div>
      </div>
      
      {/* Efecto de fondo sutil */}
      <div className={cn(
        'absolute top-0 right-0 w-20 h-20 opacity-10 transform rotate-12 translate-x-4 -translate-y-4',
        `bg-gradient-to-br ${colorClasses[color].split(' ').slice(0, 2).join(' ')}`
      )} />
    </Card>
  );
};

// === FUNCIÓN HELPER PARA ÍCONOS DE ACTIVIDAD ===
const getActivityIcon = (type: RecentActivity['type']) => {
  const iconMap = {
    score_update: (
      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
        <EquestrianIcons.Score size={16} color="rgb(34, 197, 94)" />
      </div>
    ),
    ranking_change: (
      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
        <EquestrianIcons.Ranking size={16} color="rgb(245, 158, 11)" />
      </div>
    ),
    judge_login: (
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
        <EquestrianIcons.Judge size={16} color="rgb(59, 130, 246)" />
      </div>
    ),
    sync_complete: (
      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
        <EquestrianIcons.Sync size={16} color="rgb(168, 85, 247)" />
      </div>
    )
  };
  
  return iconMap[type];
};

// === COMPONENTE DE SCORE INPUT RENOVADO ===
export const ScoreInputPremium: React.FC<{
  participant: {
    id: string;
    name: string;
    horse: string;
    number: number;
    category: string;
  };
  exercises: Array<{
    id: string;
    name: string;
    coefficient: number;
    score?: number;
  }>;
  onScoreChange: (exerciseId: string, score: number) => void;
}> = ({ participant, exercises, onScoreChange }) => {
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  
  const totalScore = exercises.reduce((sum, ex) => 
    sum + (ex.score || 0) * ex.coefficient, 0
  );
  const totalCoefficients = exercises.reduce((sum, ex) => sum + ex.coefficient, 0);
  const averageScore = totalCoefficients > 0 ? totalScore / totalCoefficients : 0;
  const percentage = (averageScore / 10) * 100;
  const completedExercises = exercises.filter(ex => ex.score !== undefined).length;
  const progress = (completedExercises / exercises.length) * 100;

  return (
    <div className="space-y-6">
      
      {/* Header del participante */}
      <Card variant="equestrian" className="sticky top-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Avatar con número */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-equestrian-gold-400 to-equestrian-gold-600 flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">
                {participant.number}
              </span>
            </div>
            
            {/* Información del participante */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {participant.name}
              </h2>
              <div className="flex items-center space-x-2 text-gray-600">
                <EquestrianIcons.Horse size={18} />
                <span className="font-medium">{participant.horse}</span>
                <span>•</span>
                <span>{participant.category}</span>
              </div>
            </div>
          </div>
          
          {/* Métricas en tiempo real */}
          <div className="text-right">
            <div className="flex items-center space-x-6">
              <div>
                <div className="text-sm text-gray-600">Puntuación</div>
                <div className="text-3xl font-bold text-gradient-primary">
                  {formatFEIScore(averageScore)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Porcentaje</div>
                <div className="text-3xl font-bold text-gradient-success">
                  {formatFEIPercentage(percentage)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Progreso</div>
                <div className="text-lg font-bold text-gray-900">
                  {completedExercises}/{exercises.length}
                </div>
              </div>
            </div>
            
            {/* Barra de progreso */}
            <div className="mt-3">
              <Progress 
                value={progress} 
                variant="equestrian" 
                showPercentage 
                animated 
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Grid de ejercicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map((exercise) => (
          <Card
            key={exercise.id}
            interactive
            highlighted={activeExercise === exercise.id}
            className={cn(
              'transition-all duration-200',
              exercise.score !== undefined && 'ring-2 ring-green-200',
              activeExercise === exercise.id && 'scale-105 z-20'
            )}
            onClick={() => setActiveExercise(
              activeExercise === exercise.id ? null : exercise.id
            )}
          >
            <div className="space-y-4">
              
              {/* Header del ejercicio */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 truncate">
                  {exercise.name}
                </h3>
                <Badge variant="gray">
                  Coef. {exercise.coefficient}
                </Badge>
              </div>
              
              {/* Input de puntuación */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={exercise.score || ''}
                    onChange={(e) => {
                      const score = parseFloat(e.target.value);
                      if (!isNaN(score)) {
                        onScoreChange(exercise.id, score);
                      }
                    }}
                    onFocus={() => setActiveExercise(exercise.id)}
                    className={cn(
                      'score-input-premium w-24 h-16 text-center text-2xl font-bold',
                      exercise.score !== undefined && getFEIScoreClasses(exercise.score)
                    )}
                    placeholder="0.0"
                  />
                  
                  {/* Indicador de estado */}
                  {exercise.score !== undefined && (
                    <div className="absolute -top-2 -right-2">
                      <ScoreStatusIcon score={exercise.score} size={24} />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Información adicional */}
              {exercise.score !== undefined && (
                <div className="text-center space-y-1">
                  <div className="text-sm font-medium text-gray-700">
                    {getFEIScoreDescription(exercise.score)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Ponderado: {formatFEIScore(exercise.score * exercise.coefficient)}
                  </div>
                </div>
              )}
              
              {/* Botones rápidos de puntuación */}
              {activeExercise === exercise.id && (
                <div className="grid grid-cols-5 gap-1 animate-fade-in-up">
                  {[6, 7, 8, 9, 10].map((score) => (
                    <button
                      key={score}
                      onClick={(e) => {
                        e.stopPropagation();
                        onScoreChange(exercise.id, score);
                      }}
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded-md transition-all',
                        'hover:scale-105 active:scale-95',
                        exercise.score === score 
                          ? 'bg-equestrian-gold-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      )}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      {/* Resumen final */}
      <Card variant="success">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Resumen de Evaluación
            </h3>
            <p className="text-gray-600">
              {completedExercises} de {exercises.length} ejercicios completados
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Ponderado</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatFEIScore(totalScore)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600">Promedio Final</div>
              <div className="text-2xl font-bold text-green-600">
                {formatFEIScore(averageScore)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600">Porcentaje FEI</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatFEIPercentage(percentage)}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// === HELPERS ===
const getFEIScoreClasses = (score: number): string => {
  if (score >= 9) return 'border-green-400 bg-green-50 text-green-800';
  if (score >= 7) return 'border-blue-400 bg-blue-50 text-blue-800';
  if (score >= 5) return 'border-yellow-400 bg-yellow-50 text-yellow-800';
  if (score >= 3) return 'border-orange-400 bg-orange-50 text-orange-800';
  return 'border-red-400 bg-red-50 text-red-800';
};

const getFEIScoreDescription = (score: number): string => {
  if (score >= 9) return 'Excelente';
  if (score >= 7) return 'Muy Bueno';
  if (score >= 5) return 'Bueno';
  if (score >= 3) return 'Satisfactorio';
  return 'Insuficiente';
};

// === EJEMPLO DE USO DEL DASHBOARD ===
export const DashboardExample: React.FC = () => {
  return (
    <div className="min-h-screen">
      <DashboardPremium />
    </div>
  );
};

// === COMPONENTE PARA MOSTRAR ANTES/DESPUÉS ===
export const BeforeAfterComparison: React.FC = () => {
  const [showAfter, setShowAfter] = useState(false);
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gradient-primary mb-4">
          Transformación Visual del Sistema FEI
        </h2>
        <p className="text-gray-600 mb-6">
          Ve la diferencia que hace el nuevo sistema de diseño
        </p>
        
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={!showAfter ? "primary" : "secondary"}
            onClick={() => setShowAfter(false)}
          >
            Antes (Básico)
          </Button>
          <Button
            variant={showAfter ? "equestrian" : "secondary"}
            onClick={() => setShowAfter(true)}
          >
            Después (Premium)
          </Button>
        </div>
      </div>
      
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50">
        {showAfter ? (
          <DashboardPremium />
        ) : (
          <div className="bg-white p-6 rounded border shadow-sm">
            <h1 className="text-xl font-bold mb-4">Sistema FEI - Básico</h1>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-sm text-gray-600">Competencias</div>
                <div className="text-2xl font-bold">3</div>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-sm text-gray-600">Participantes</div>
                <div className="text-2xl font-bold">42</div>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-sm text-gray-600">Puntuaciones</div>
                <div className="text-2xl font-bold">156</div>
              </div>
              <div className="bg-gray-100 p-4 rounded">
                <div className="text-sm text-gray-600">Jueces</div>
                <div className="text-2xl font-bold">8</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between bg-gray-50 p-2 rounded">
                <span>María González - Tornado</span>
                <span>8.5</span>
              </div>
              <div className="flex justify-between bg-gray-50 p-2 rounded">
                <span>Carlos Ruiz - Estrella</span>
                <span>8.2</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <Alert variant="info" className="inline-block">
          <strong>¡Transformación completa!</strong> El nuevo sistema mantiene toda la funcionalidad 
          pero con una experiencia visual premium que refleja la calidad del sistema técnico.
        </Alert>
      </div>
    </div>
  );
};

export default DashboardPremium;