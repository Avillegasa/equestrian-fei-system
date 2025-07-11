// 🧪 Página de Prueba Completa - Sistema de Diseño Premium FEI
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
  RankingPosition,
  Skeleton,
  Notification,
  GlassCard,
  ScoreStatusIcon,
  ConnectivityIcon,
  LoadingIcon,
  Table,
  Modal,
  Tooltip
} from '@/components/ui';
import { EquestrianIcons } from '@/components/icons/equestrian';

export default function TestDesignSystemPage() {
  const [score, setScore] = useState(7.5);
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

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
                <Button 
                  variant="success" 
                  icon={<EquestrianIcons.Horse size={18} />}
                >
                  Con Ícono
                </Button>
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
                icon={<EquestrianIcons.Rider size={18} />}
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
                <EquestrianIcons.Competition size={48} className="mx-auto mb-3 text-blue-600" />
                <h3 className="font-bold mb-2">Card Básica</h3>
                <p className="text-gray-600 text-sm">
                  Esta es una card con diseño estándar
                </p>
              </div>
            </Card>

            {/* Card ecuestre */}
            <Card variant="equestrian">
              <div className="text-center">
                <EquestrianIcons.Medal size={48} className="mx-auto mb-3 text-equestrian-gold-600" />
                <h3 className="font-bold mb-2">Card Ecuestre</h3>
                <p className="text-gray-600 text-sm">
                  Card con tema ecuestre premium
                </p>
              </div>
            </Card>

            {/* Card interactiva */}
            <Card 
              interactive 
              onClick={() => setShowModal(true)}
              className="cursor-pointer"
            >
              <div className="text-center">
                <EquestrianIcons.Judge size={48} className="mx-auto mb-3 text-purple-600" />
                <h3 className="font-bold mb-2">Card Interactiva</h3>
                <p className="text-gray-600 text-sm">
                  Haz click para abrir modal
                </p>
              </div>
            </Card>
          </div>

          {/* Glass Card */}
          <div className="mt-6 relative">
            <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl"></div>
            <div className="absolute inset-4">
              <GlassCard>
                <div className="text-white text-center">
                  <h3 className="font-bold mb-2">Glass Card</h3>
                  <p className="text-sm opacity-90">
                    Efecto glassmorphism sobre fondo colorido
                  </p>
                </div>
              </GlassCard>
            </div>
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
                  <RankingPosition position={1} animated />
                  <RankingPosition position={2} />
                  <RankingPosition position={3} />
                  <RankingPosition position={4} />
                </div>

                {/* Score Status */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium w-20">Scores:</span>
                  <ScoreStatusIcon score={9.5} />
                  <ScoreStatusIcon score={8.0} />
                  <ScoreStatusIcon score={6.5} />
                  <ScoreStatusIcon score={4.0} />
                  <ScoreStatusIcon score={2.0} />
                </div>

                {/* Conectividad */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium w-20">Estado:</span>
                  <ConnectivityIcon isOnline={isOnline} showLabel />
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setIsOnline(!isOnline)}
                  >
                    Toggle
                  </Button>
                </div>

                {/* Loading */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium w-20">Carga:</span>
                  <LoadingIcon progress={75} />
                  <LoadingIcon />
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
            
            <Alert variant="error" title="Error" dismissible>
              No se pudo conectar con el servidor. Verificando conexión...
            </Alert>
            
            <Alert variant="info" title="Información">
              El ranking se actualiza automáticamente cada 30 segundos.
            </Alert>
          </div>

          <div className="mt-6">
            <Button 
              onClick={() => setShowNotification(true)}
              variant="primary"
            >
              Mostrar Notificación Toast
            </Button>
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

        {/* Sección 8: Íconos Temáticos */}
        <Card className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            🐎 Íconos Temáticos Ecuestres
          </h2>
          
          <div className="grid grid-cols-4 md:grid-cols-8 gap-6">
            {[
              { icon: EquestrianIcons.Horse, label: 'Caballo' },
              { icon: EquestrianIcons.Rider, label: 'Jinete' },
              { icon: EquestrianIcons.Competition, label: 'Competencia' },
              { icon: EquestrianIcons.Judge, label: 'Juez' },
              { icon: EquestrianIcons.Dressage, label: 'Dressage' },
              { icon: EquestrianIcons.Score, label: 'Puntuación' },
              { icon: EquestrianIcons.Ranking, label: 'Ranking' },
              { icon: EquestrianIcons.Medal, label: 'Medalla' },
              { icon: EquestrianIcons.Timer, label: 'Tiempo' },
              { icon: EquestrianIcons.Arena, label: 'Arena' },
              { icon: EquestrianIcons.Stats, label: 'Estadísticas' },
              { icon: EquestrianIcons.Live, label: 'En Vivo' }
            ].map((item, index) => (
              <Tooltip key={index} content={item.label}>
                <div className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <item.icon size={32} className="text-gray-600 mb-2" />
                  <span className="text-xs text-gray-500 text-center">
                    {item.label}
                  </span>
                </div>
              </Tooltip>
            ))}
          </div>
        </Card>

        {/* Sección 9: Loading States */}
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

        {/* Sección 10: Responsive Test */}
        <Card>
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            📱 Test Responsive
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} variant="default" className="text-center">
                <EquestrianIcons.Horse size={24} className="mx-auto mb-2 text-blue-600" />
                <p className="text-sm">Item {index + 1}</p>
              </Card>
            ))}
          </div>
          
          <Alert variant="info" className="mt-6">
            <strong>Test Responsive:</strong> Redimensiona la ventana para ver cómo se adaptan los componentes.
          </Alert>
        </Card>
      </div>

      {/* Modal de ejemplo */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Modal de Prueba"
        size="md"
      >
        <div className="space-y-4">
          <p>Este es un modal de ejemplo del sistema de diseño.</p>
          
          <div className="flex items-center space-x-4">
            <EquestrianIcons.Horse size={32} className="text-equestrian-gold-600" />
            <div>
              <h3 className="font-semibold">Modal Funcional</h3>
              <p className="text-sm text-gray-600">
                Todos los componentes funcionan correctamente dentro del modal.
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button variant="equestrian" onClick={() => setShowModal(false)}>
              Cerrar Modal
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Notificación de ejemplo */}
      {showNotification && (
        <Notification
          title="¡Sistema Funcionando!"
          variant="success"
          position="top-right"
          onClose={() => setShowNotification(false)}
        >
          Todos los componentes del sistema de diseño están funcionando correctamente.
        </Notification>
      )}
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