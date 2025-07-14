// 🎬 Cinematic Public Display - Subfase 6.5.4.2
// Archivo: frontend/src/components/rankings/CinematicPublicDisplay.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX,
  Crown, 
  Trophy, 
  Medal,
  Award,
  Clock,
  Signal,
  SignalZero,
  Star,
  Activity
} from 'lucide-react';

// === TIPOS Y INTERFACES ===
interface ParticipantData {
  id: string;
  position: number;
  rider_name: string;
  horse_name: string;
  total_score: number;
  percentage_score: number;
  position_change: number;
  country: string;
  category: string;
  evaluations_completed: number;
  evaluations_total: number;
}

interface CinematicPublicDisplayProps {
  entries: ParticipantData[];
  competitionName: string;
  categoryName: string;
  location: string;
  date: string;
  isConnected: boolean;
  autoRotate?: boolean;
  rotationInterval?: number; // en segundos
  showTop?: number;
  theme?: 'dark' | 'light' | 'branded';
  logoUrl?: string;
  className?: string;
}

// === COMPONENTE MEDALLÓN CINEMATOGRÁFICO ===
const CinematicMedallion = ({ position, size = 'lg' }: { position: number; size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-20 h-20 text-xl',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-32 h-32 text-3xl'
  };

  const getPositionStyle = (pos: number) => {
    if (pos === 1) return {
      bg: 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600',
      shadow: 'shadow-2xl shadow-yellow-500/50',
      glow: 'drop-shadow-2xl',
      icon: Crown
    };
    if (pos === 2) return {
      bg: 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600',
      shadow: 'shadow-2xl shadow-gray-500/50',
      glow: 'drop-shadow-xl',
      icon: Medal
    };
    if (pos === 3) return {
      bg: 'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800',
      shadow: 'shadow-2xl shadow-amber-600/50',
      glow: 'drop-shadow-xl',
      icon: Award
    };
    return {
      bg: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800',
      shadow: 'shadow-xl shadow-blue-600/30',
      glow: 'drop-shadow-lg',
      icon: Trophy
    };
  };

  const style = getPositionStyle(position);
  const IconComponent = style.icon;

  return (
    <motion.div
      className={`${sizeClasses[size]} ${style.bg} ${style.shadow} ${style.glow} rounded-full flex items-center justify-center font-bold text-white relative overflow-hidden`}
      initial={{ scale: 0, rotate: -360 }}
      animate={{ 
        scale: 1, 
        rotate: 0,
        boxShadow: [
          '0 0 20px rgba(0,0,0,0.3)',
          '0 0 40px rgba(255,215,0,0.6)',
          '0 0 20px rgba(0,0,0,0.3)'
        ]
      }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 15,
        boxShadow: { duration: 2, repeat: Infinity, repeatType: "reverse" }
      }}
      whileHover={{ scale: 1.1, rotate: 10 }}
    >
      {/* Animación de brillo */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent"
        initial={{ x: '-100%', opacity: 0 }}
        animate={{ 
          x: ['−100%', '100%', '100%'],
          opacity: [0, 1, 0]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          repeatDelay: 2,
          ease: "easeInOut"
        }}
      />
      
      <div className="relative z-10 flex items-center justify-center">
        {position <= 3 ? (
          <IconComponent className="w-8 h-8" />
        ) : (
          <span className="font-black">{position}</span>
        )}
      </div>
    </motion.div>
  );
};

// === COMPONENTE ENTRADA DE PARTICIPANTE ===
const ParticipantEntry = ({ 
  participant, 
  index, 
  isHighlighted = false,
  showDetails = true 
}: { 
  participant: ParticipantData; 
  index: number;
  isHighlighted?: boolean;
  showDetails?: boolean;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generar partículas solo en el cliente
  const generateParticles = () => {
    if (!mounted) return [];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 300,
      y: Math.random() * 100,
      delay: i * 0.3
    }));
  };

  const particles = generateParticles();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -100, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        scale: isHighlighted ? 1.05 : 1,
        boxShadow: isHighlighted ? '0 0 30px rgba(59, 130, 246, 0.6)' : '0 4px 20px rgba(0,0,0,0.1)'
      }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 20
      }}
      className={`
        relative overflow-hidden rounded-2xl p-6 backdrop-blur-lg
        ${isHighlighted 
          ? 'bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 border-2 border-blue-400' 
          : 'bg-white/10 border border-white/20'
        }
        ${participant.position <= 3 ? 'ring-2 ring-yellow-400/50' : ''}
      `}
    >
      {/* Efecto de partículas para top 3 */}
      {participant.position <= 3 && mounted && (
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              initial={{ 
                x: particle.x, 
                y: particle.y,
                opacity: 0 
              }}
              animate={{ 
                y: [null, -20, -40],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-6">
        {/* Medallón de posición */}
        <CinematicMedallion position={participant.position} size="lg" />

        {/* Información del participante */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <motion.h3 
              className="text-2xl font-bold text-white truncate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {participant.rider_name}
            </motion.h3>
            <motion.div 
              className="text-right"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-3xl font-black text-yellow-400">
                {participant.total_score.toFixed(2)}
              </div>
              <div className="text-lg text-yellow-300">
                {participant.percentage_score.toFixed(1)}%
              </div>
            </motion.div>
          </div>

          <motion.div 
            className="flex items-center gap-4 text-white/80"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-lg">{participant.horse_name}</span>
            </div>
            <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
              {participant.country}
            </div>
          </motion.div>

          {showDetails && (
            <motion.div 
              className="mt-3 flex items-center justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {/* Barra de progreso */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/70">Progreso:</span>
                <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(participant.evaluations_completed / participant.evaluations_total) * 100}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                  />
                </div>
                <span className="text-sm text-white/70">
                  {participant.evaluations_completed}/{participant.evaluations_total}
                </span>
              </div>

              {/* Indicador de cambio */}
              {participant.position_change !== 0 && (
                <motion.div 
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                    participant.position_change > 0 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                >
                  {participant.position_change > 0 ? '↑' : '↓'}
                  {Math.abs(participant.position_change)}
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// === COMPONENTE PRINCIPAL ===
export const CinematicPublicDisplay: React.FC<CinematicPublicDisplayProps> = ({
  entries,
  competitionName,
  categoryName,
  location,
  date,
  isConnected,
  autoRotate = true,
  rotationInterval = 10,
  showTop = 10,
  theme = 'branded',
  logoUrl,
  className = ''
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  const entriesPerPage = 5;
  const totalPages = Math.ceil(Math.min(entries.length, showTop) / entriesPerPage);
  const displayEntries = entries.slice(0, showTop);

  // Solo en el cliente
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toLocaleTimeString());
    
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Auto-rotación de páginas
  useEffect(() => {
    if (!autoRotate || totalPages <= 1 || !mounted) return;

    const interval = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }, rotationInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRotate, rotationInterval, totalPages, mounted]);

  // Destacar entradas secuencialmente
  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      setHighlightedIndex(prev => {
        const pageStart = currentPage * entriesPerPage;
        const pageEnd = Math.min(pageStart + entriesPerPage, displayEntries.length);
        const nextIndex = prev + 1;
        
        if (nextIndex >= pageEnd || nextIndex < pageStart) {
          return pageStart;
        }
        return nextIndex;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [currentPage, displayEntries.length, entriesPerPage, mounted]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Detectar cambios de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const getThemeClasses = () => {
    switch (theme) {
      case 'dark':
        return 'bg-gradient-to-br from-gray-900 via-slate-900 to-black';
      case 'light':
        return 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50';
      default: // branded
        return 'bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900';
    }
  };

  const currentPageEntries = displayEntries.slice(
    currentPage * entriesPerPage,
    (currentPage + 1) * entriesPerPage
  );

  // No renderizar hasta que esté montado en el cliente
  if (!mounted) {
    return (
      <div className={`${getThemeClasses()} min-h-screen flex items-center justify-center`}>
        <div className="text-white text-2xl">Cargando display...</div>
      </div>
    );
  }

  return (
    <div className={`
      ${getThemeClasses()} 
      min-h-screen relative overflow-hidden
      ${isFullscreen ? 'fixed inset-0 z-50' : ''}
      ${className}
    `}>
      {/* Fondo animado */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)`
          }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="relative z-10 p-6 lg:p-8"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {logoUrl && (
              <motion.img
                src={logoUrl}
                alt="Logo"
                className="h-16 w-auto"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              />
            )}
            <div>
              <motion.h1 
                className="text-4xl lg:text-5xl font-black text-white mb-2"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {competitionName}
              </motion.h1>
              <motion.p 
                className="text-xl lg:text-2xl text-yellow-400"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                {categoryName}
              </motion.p>
              <motion.div 
                className="flex items-center gap-4 mt-2 text-white/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <span>{location}</span>
                <span>•</span>
                <span>{date}</span>
              </motion.div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Estado de conexión */}
            <motion.div 
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                isConnected 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}
              animate={{ scale: isConnected ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 2, repeat: isConnected ? Infinity : 0 }}
            >
              {isConnected ? (
                <Signal className="w-5 h-5" />
              ) : (
                <SignalZero className="w-5 h-5" />
              )}
              <span className="text-sm font-medium">
                {isConnected ? 'EN VIVO' : 'DESCONECTADO'}
              </span>
            </motion.div>

            {/* Controles */}
            <div className="flex gap-2">
              <motion.button
                onClick={() => setIsMuted(!isMuted)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </motion.button>

              <motion.button
                onClick={toggleFullscreen}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Contenido principal */}
      <main className="relative z-10 px-6 lg:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Indicadores de página */}
          {totalPages > 1 && (
            <motion.div 
              className="flex justify-center gap-2 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {Array.from({ length: totalPages }, (_, i) => (
                <motion.div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i === currentPage ? 'bg-yellow-400 w-8' : 'bg-white/30'
                  }`}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </motion.div>
          )}

          {/* Lista de participantes */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {currentPageEntries.map((participant, index) => (
                <ParticipantEntry
                  key={`${participant.id}-${currentPage}`}
                  participant={participant}
                  index={index}
                  isHighlighted={highlightedIndex === currentPage * entriesPerPage + index}
                  showDetails={!isFullscreen || entriesPerPage <= 3}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Estadísticas en tiempo real */}
          <motion.div 
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {entries.length}
              </div>
              <div className="text-white/70">Participantes</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-400">
                {entries.filter(e => e.evaluations_completed === e.evaluations_total).length}
              </div>
              <div className="text-white/70">Completados</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 flex items-center justify-center gap-2">
                <Clock className="w-6 h-6" />
                {currentTime}
              </div>
              <div className="text-white/70">Última actualización</div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Partículas de fondo */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              initial={{
                x: Math.random() * 1200,
                y: Math.random() * 800,
              }}
              animate={{
                y: [null, -800],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "linear"
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};