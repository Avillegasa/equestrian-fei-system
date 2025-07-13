// 🧪 Página de Prueba Simplificada - SIN errores de hidratación
// Archivo: frontend/src/app/test-design/page.tsx

"use client";

import React, { useState } from 'react';
import {
  Button,
  Input,
  ScoreInput,
  Card,
  Badge,
  Progress,
  Alert,
  Skeleton,
  Table
} from '@/components/ui';

// Componente RankingPosition simplificado para evitar hidratación
const RankingPositionSimple: React.FC<{
  position: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}> = ({ position, size = 'md', animated = false, className = '' }) => {
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-12 h-12 text-lg'
  };
  
  const getPositionStyle = (pos: number) => {
    if (pos === 1) {
      return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900 shadow-lg border-2 border-yellow-300';
    }
    if (pos === 2) {
      return 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900 shadow-lg border-2 border-gray-200';
    }
    if (pos === 3) {
      return 'bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900 shadow-lg border-2 border-orange-300';
    }
    return 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-800 shadow-md border border-blue-200';
  };
  
  return (
    <div className={`inline-flex items-center justify-center rounded-full font-bold ${sizes[size]} ${getPositionStyle(position)} ${animated ? 'animate-bounce' : ''} ${className}`}>
      {position}
    </div>
  );
};

export default function TestDesignSystemPage() {
  const [score, setScore] = useState(7.5);
  const [loading, setLoading] = useState(false);

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const mockTableData = [
    { nombre: 'María González', caballo: 'Tornado', puntuacion: 8.5, posicion: 1 },
    { nombre: 'Carlos Ruiz', caballo: 'Estrella', puntuacion: 8.2, posicion: 2 },
    { nombre: 'Ana Martín', caballo: 'Rayo', puntuacion: 7.9, posicion: 3 },
    { nombre: 'Luis Pérez', caballo: 'Viento', puntuacion: 7.6, posicion: 4 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">

          {/* === TEST DIRECTO CSS === */}
    <div className="max-w-7xl mx-auto p-4">
      <div className="test-gold">
        🧪 TEST: ¿Se ve este fondo dorado?
      </div>
      
      <div className="test-gradient">
        🧪 TEST: ¿Se ve este gradiente de oro a azul?
      </div>
      
      <button className="test-hover bg-gray-200 p-4 rounded">
        🧪 TEST: Hover aquí - ¿Cambia de color?
      </button>
      
      <div className="bg-red-500 text-white p-4 rounded mt-4">
        🧪 TEST: ¿Se ve este fondo rojo (Tailwind básico)?
      </div>
    </div>
      
      {/* Header de la página de pruebas */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient-primary mb-4">
            🧪 Sistema de Diseño Premium FEI
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Página de prueba para verificar todos los componentes y estilos
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge variant="success">Subfase 6.5.1</Badge>
            <Badge variant="equestrian">Sistema de Diseño Base</Badge>
            <Badge variant="info">Testing</Badge>
          </div>
        </div>

        {/* Sección 1: Paleta de Colores */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            🎨 Paleta de Colores Ecuestre
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Colores Primarios */}
            <div>
              <h3 className="font-semibold mb-3">Colores Primarios</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-equestrian-gold-500 rounded-full shadow-lg"></div>
                  <span className="text-sm">Oro Ecuestre (#D4AF37)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-equestrian-blue-600 rounded-full shadow-lg"></div>
                  <span className="text-sm">Azul Noble (#1E3A8A)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-equestrian-green-500 rounded-full shadow-lg"></div>
                  <span className="text-sm">Verde Competencia (#059669)</span>
                </div>
              </div>
            </div>

            {/* Gradientes */}
            <div>
              <h3 className="font-semibold mb-3">Gradientes</h3>
              <div className="space-y-2">
                <div className="h-8 bg-gradient-equestrian rounded-lg shadow-lg"></div>
                <div className="h-8 bg-gradient-success rounded-lg shadow-lg"></div>
                <div className="h-8 bg-gradient-warning rounded-lg shadow-lg"></div>
              </div>
            </div>

            {/* Estados */}
            <div>
              <h3 className="font-semibold mb-3">Estados</h3>
              <div className="space-y-2">
                <Badge variant="success">Excelente (9-10)</Badge>
                <Badge variant="info">Muy Bueno (7-8.5)</Badge>
                <Badge variant="warning">Bueno (5-6.5)</Badge>
                <Badge variant="error">Insuficiente (0-4.5)</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Sección 2: Botones */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            🔘 Componentes Button
          </h2>
          
          <div className="space-y-6">
            {/* Variantes */}
            <div>
              <h3 className="font-semibold mb-3">Variantes</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primario</Button>
                <Button variant="secondary">Secundario</Button>
                <Button variant="success">Éxito</Button>
                <Button variant="danger">Peligro</Button>
                <Button variant="ghost">Fantasma</Button>
                <Button variant="equestrian">Ecuestre Premium</Button>
              </div>
            </div>

            {/* Tamaños */}
            <div>
              <h3 className="font-semibold mb-3">Tamaños</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Pequeño</Button>
                <Button size="md">Mediano</Button>
                <Button size="lg">Grande</Button>
                <Button size="xl">Extra Grande</Button>
              </div>
            </div>

            {/* Estados */}
            <div>
              <h3 className="font-semibold mb-3">Estados</h3>
              <div className="flex flex-wrap gap-3">
                <Button 
                  loading={loading} 
                  onClick={simulateLoading}
                  variant="primary"
                >
                  {loading ? 'Cargando...' : 'Simular Carga'}
                </Button>
                <Button disabled>Deshabilitado</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Sección 3: Inputs y Formularios */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            📝 Inputs y Formularios
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input básico */}
            <div>
              <Input
                label="Input Básico"
                placeholder="Escribe algo aquí..."
              />
            </div>

            {/* Input con validación */}
            <div>
              <Input
                label="Input con Error"
                placeholder="Campo con error"
                error="Este campo es requerido"
                defaultValue="valor incorrecto"
              />
            </div>

            {/* Input con éxito */}
            <div>
              <Input
                label="Input Exitoso"
                placeholder="Campo validado"
                success="¡Validación exitosa!"
                defaultValue="valor correcto"
              />
            </div>

            {/* Score Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Score Input FEI
              </label>
              <ScoreInput
                value={score}
                onScoreChange={setScore}
                showQuickSelect={true}
              />
              <p className="text-sm text-gray-600 mt-1">
                Puntuación actual: {score} - {getScoreDescription(score)}
              </p>
            </div>
          </div>
        </Card>

        {/* Sección 4: Cards y Layouts */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            📋 Cards y Layouts
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card básica */}
            <Card variant="default">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl">
                  🏆
                </div>
                <h3 className="font-bold mb-2">Card Básica</h3>
                <p className="text-gray-600 text-sm">
                  Esta es una card con diseño estándar
                </p>
              </div>
            </Card>

            {/* Card ecuestre */}
            <Card variant="equestrian">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-equestrian-gold-600 rounded-full flex items-center justify-center text-white text-xl">
                  🥇
                </div>
                <h3 className="font-bold mb-2">Card Ecuestre</h3>
                <p className="text-gray-600 text-sm">
                  Card con tema ecuestre premium
                </p>
              </div>
            </Card>

            {/* Card interactiva */}
            <Card interactive>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl">
                  👨‍⚖️
                </div>
                <h3 className="font-bold mb-2">Card Interactiva</h3>
                <p className="text-gray-600 text-sm">
                  Hover para ver efecto
                </p>
              </div>
            </Card>
          </div>
        </Card>

        {/* Sección 5: Indicadores y Estados */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            📊 Indicadores y Estados
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Progress Bars */}
            <div>
              <h3 className="font-semibold mb-4">Barras de Progreso</h3>
              <div className="space-y-4">
                <Progress 
                  value={85} 
                  variant="equestrian" 
                  showPercentage 
                  showLabel
                >
                  Progreso Ecuestre
                </Progress>
                
                <Progress 
                  value={92} 
                  variant="success" 
                  showPercentage 
                  showLabel
                >
                  Calificaciones Completadas
                </Progress>
                
                <Progress 
                  value={67} 
                  variant="warning" 
                  showPercentage 
                  showLabel
                >
                  Participantes Registrados
                </Progress>
              </div>
            </div>

            {/* Indicadores específicos */}
            <div>
              <h3 className="font-semibold mb-4">Indicadores Específicos</h3>
              <div className="space-y-4">
                {/* Ranking Positions */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium w-20">Rankings:</span>
                  <RankingPositionSimple position={1} animated />
                  <RankingPositionSimple position={2} />
                  <RankingPositionSimple position={3} />
                  <RankingPositionSimple position={4} />
                </div>

                {/* Score Status usando texto */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium w-20">Scores:</span>
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold">9.5</div>
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">8.0</div>
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">6.5</div>
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">4.0</div>
                  <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-800 text-xs font-bold">2.0</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Sección 6: Alertas y Notificaciones */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            🔔 Alertas y Notificaciones
          </h2>
          
          <div className="space-y-4">
            <Alert variant="success" title="¡Éxito!">
              La puntuación se ha guardado correctamente en el sistema.
            </Alert>
            
            <Alert variant="warning" title="Atención">
              Hay 3 calificaciones pendientes de sincronización.
            </Alert>
            
            <Alert variant="error" title="Error">
              No se pudo conectar con el servidor. Verificando conexión...
            </Alert>
            
            <Alert variant="info" title="Información">
              El ranking se actualiza automáticamente cada 30 segundos.
            </Alert>
          </div>
        </Card>

        {/* Sección 7: Tabla */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            📋 Tabla Premium
          </h2>
          
          <Table
            headers={['Nombre', 'Caballo', 'Puntuación', 'Posición']}
            data={mockTableData}
            striped
            hoverable
          />
        </Card>

        {/* Sección 8: Loading States */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            ⏳ Estados de Carga
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Skeleton Text</h3>
              <Skeleton variant="text" lines={3} />
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Skeleton Card</h3>
              <Skeleton variant="card" />
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Elementos Diversos</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Skeleton variant="circle" width="40px" />
                  <Skeleton variant="text" width="60%" />
                </div>
                <Skeleton variant="rectangle" height="60px" />
              </div>
            </div>
          </div>
        </Card>

        {/* Test de estilos específicos */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-6">
            🎨 Test de Estilos Ecuestre
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-equestrian-gold-100 border border-equestrian-gold-300 rounded-lg">
              <p className="text-equestrian-gold-800">Fondo dorado ecuestre - ¿Se ve bien?</p>
            </div>
            
            <div className="p-4 bg-gradient-equestrian rounded-lg text-white">
              <p>Gradiente ecuestre de oro a azul - ¿Se ve el gradiente?</p>
            </div>
            
            <div className="flex space-x-4">
              <button className="btn btn-primary">Botón CSS directo</button>
              <div className="badge badge-primary">Badge CSS directo</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Helper function
function getScoreDescription(score: number): string {
  if (score >= 9) return 'Excelente';
  if (score >= 7) return 'Muy Bueno';
  if (score >= 5) return 'Bueno';
  if (score >= 3) return 'Satisfactorio';
  return 'Insuficiente';
}