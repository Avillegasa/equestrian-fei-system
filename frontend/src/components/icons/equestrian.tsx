// 🐎 Íconos Temáticos Ecuestres - Sistema FEI
// Íconos SVG personalizados para el sistema

import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

// === ÍCONO DE CABALLO ===
export const HorseIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 2C10.5 2 9.5 3 9.5 4.5C9.5 5.2 9.8 5.8 10.2 6.2L8 8.5C7.5 9 7.5 9.8 8 10.3L9.5 11.8V16C9.5 17.1 10.4 18 11.5 18H12.5C13.6 18 14.5 17.1 14.5 16V11.8L16 10.3C16.5 9.8 16.5 9 16 8.5L13.8 6.2C14.2 5.8 14.5 5.2 14.5 4.5C14.5 3 13.5 2 12 2Z" />
    <path d="M8 12L6 14" />
    <path d="M16 12L18 14" />
    <path d="M11.5 18V22" />
    <path d="M12.5 18V22" />
    <circle cx="11" cy="5" r="0.5" />
    <circle cx="13" cy="5" r="0.5" />
  </svg>
);

// === ÍCONO DE JINETE ===
export const RiderIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="5" r="2" />
    <path d="M10 8H14L15 12H17L18 16H16L15 20H13L12 16L11 20H9L8 16H6L7 12H9L10 8Z" />
    <path d="M8 16L6 18" />
    <path d="M16 16L18 18" />
    <path d="M10 3H14" />
  </svg>
);

// === ÍCONO DE COMPETENCIA ===
export const CompetitionIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 9H4.5C3.12 9 2 10.12 2 11.5V18.5C2 19.88 3.12 21 4.5 21H6V9Z" />
    <path d="M18 9H19.5C20.88 9 22 10.12 22 11.5V18.5C22 19.88 20.88 21 19.5 21H18V9Z" />
    <rect x="6" y="9" width="12" height="12" rx="1" />
    <path d="M12 2L14 7H19L15 10L16.5 15L12 12L7.5 15L9 10L5 7H10L12 2Z" />
  </svg>
);

// === ÍCONO DE JUEZ ===
export const JudgeIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="6" r="4" />
    <path d="M8 14V22H16V14" />
    <path d="M8 14H16" />
    <path d="M10 18H14" />
    <path d="M4 14L8 14" />
    <path d="M16 14L20 14" />
    <rect x="9" y="2" width="6" height="2" rx="1" />
  </svg>
);

// === ÍCONO DE DRESSAGE ===
export const DressageIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 8L16 16" />
    <path d="M16 8L8 16" />
    <circle cx="8" cy="8" r="1" />
    <circle cx="16" cy="8" r="1" />
    <circle cx="8" cy="16" r="1" />
    <circle cx="16" cy="16" r="1" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);

// === ÍCONO DE PUNTUACIÓN ===
export const ScoreIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 8H17" />
    <path d="M7 12H17" />
    <path d="M7 16H13" />
    <circle cx="17" cy="16" r="2" />
    <path d="M16 15L17 16L18 15" />
  </svg>
);

// === ÍCONO DE RANKING ===
export const RankingIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="9" y="12" width="6" height="9" rx="1" />
    <rect x="3" y="16" width="6" height="5" rx="1" />
    <rect x="15" y="8" width="6" height="13" rx="1" />
    <path d="M12 2L13.5 5H17L14.5 7.5L15.5 11L12 9L8.5 11L9.5 7.5L7 5H10.5L12 2Z" />
  </svg>
);

// === ÍCONO DE CRONÓMETRO ===
export const TimerIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9V13L16 15" />
    <path d="M9 4.5H15" />
    <path d="M12 2V4.5" />
  </svg>
);

// === ÍCONO DE MEDALLA ===
export const MedalIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="15" r="6" />
    <path d="M12 9L15 2L17 4L20 2L17 9" />
    <path d="M12 9L9 2L7 4L4 2L7 9" />
    <circle cx="12" cy="15" r="3" />
  </svg>
);

// === ÍCONO DE ARENA ===
export const ArenaIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="6" width="20" height="12" rx="3" />
    <path d="M6 10H18" />
    <path d="M6 14H18" />
    <circle cx="6" cy="6" r="1" />
    <circle cx="18" cy="6" r="1" />
    <circle cx="6" cy="18" r="1" />
    <circle cx="18" cy="18" r="1" />
  </svg>
);

// === ÍCONO DE CERTIFICACIÓN ===
export const CertificationIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 12L11 14L15 10" />
    <path d="M12 2V6" />
    <path d="M12 18V22" />
    <path d="M2 12H6" />
    <path d="M18 12H22" />
  </svg>
);

// === ÍCONO DE ESTADÍSTICAS ===
export const StatsIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="12" width="4" height="9" rx="1" />
    <rect x="10" y="8" width="4" height="13" rx="1" />
    <rect x="17" y="4" width="4" height="17" rx="1" />
    <path d="M3 3L21 3" />
  </svg>
);

// === ÍCONO DE LIVE ===
export const LiveIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="1" />
    <path d="M8 8L4 4" />
    <path d="M16 8L20 4" />
    <path d="M8 16L4 20" />
    <path d="M16 16L20 20" />
  </svg>
);

// === ÍCONO DE OFFLINE ===
export const OfflineIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 9L21 9" />
    <path d="M9 21V9" />
    <path d="M15 21V9" />
    <path d="M12 3V9" />
    <circle cx="12" cy="6" r="2" />
    <path d="M3 3L21 21" />
  </svg>
);

// === ÍCONO DE SYNC ===
export const SyncIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 2V8H15" />
    <path d="M3 22V16H9" />
    <path d="M21 8L18 11A8 8 0 0 1 6 19" />
    <path d="M3 16L6 13A8 8 0 0 1 18 5" />
  </svg>
);

// === ÍCONO ESPECÍFICO FEI ===
export const FEILogoIcon: React.FC<IconProps> = ({ 
  className = '', 
  size = 24, 
  color = 'currentColor' 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 8H16" />
    <path d="M8 12H14" />
    <path d="M8 16H12" />
    <path d="M12 2L14 6H18L15 9L16 13L12 11L8 13L9 9L6 6H10L12 2" />
  </svg>
);

// === EXPORTS ===
export const EquestrianIcons = {
  Horse: HorseIcon,
  Rider: RiderIcon,
  Competition: CompetitionIcon,
  Judge: JudgeIcon,
  Dressage: DressageIcon,
  Score: ScoreIcon,
  Ranking: RankingIcon,
  Timer: TimerIcon,
  Medal: MedalIcon,
  Arena: ArenaIcon,
  Certification: CertificationIcon,
  Stats: StatsIcon,
  Live: LiveIcon,
  Offline: OfflineIcon,
  Sync: SyncIcon,
  FEILogo: FEILogoIcon
};

// === COMPONENTE DE ÍCONO ANIMADO ===
interface AnimatedIconProps extends IconProps {
  animation?: 'spin' | 'pulse' | 'bounce' | 'ping';
  duration?: 'fast' | 'normal' | 'slow';
}

export const AnimatedIcon: React.FC<AnimatedIconProps & { icon: React.ComponentType<IconProps> }> = ({
  icon: Icon,
  animation = 'pulse',
  duration = 'normal',
  className = '',
  ...props
}) => {
  const animations = {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    ping: 'animate-ping'
  };
  
  const durations = {
    fast: 'duration-150',
    normal: 'duration-300',
    slow: 'duration-500'
  };
  
  return (
    <Icon 
      className={`${animations[animation]} ${durations[duration]} ${className}`}
      {...props}
    />
  );
};

// === COMPONENTE DE ÍCONO CON BADGE ===
interface IconWithBadgeProps extends IconProps {
  icon: React.ComponentType<IconProps>;
  badge?: string | number;
  badgeColor?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const IconWithBadge: React.FC<IconWithBadgeProps> = ({
  icon: Icon,
  badge,
  badgeColor = 'red',
  badgePosition = 'top-right',
  className = '',
  size = 24,
  ...props
}) => {
  const badgeColors = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    yellow: 'bg-yellow-500 text-black',
    purple: 'bg-purple-500 text-white'
  };
  
  const positions = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1'
  };
  
  return (
    <div className="relative inline-block">
      <Icon className={className} size={size} {...props} />
      {badge && (
        <span className={`
          absolute ${positions[badgePosition]} 
          inline-flex items-center justify-center 
          px-1.5 py-0.5 text-xs font-bold leading-none 
          ${badgeColors[badgeColor]} 
          rounded-full transform translate-x-1/2 -translate-y-1/2
          min-w-[1.25rem] h-5
        `}>
          {badge}
        </span>
      )}
    </div>
  );
};

// === GRUPO DE ÍCONOS ECUESTRE ===
export const EquestrianIconGroup: React.FC<{
  icons: Array<{
    icon: React.ComponentType<IconProps>;
    label?: string;
    color?: string;
    size?: number;
  }>;
  spacing?: 'tight' | 'normal' | 'loose';
  direction?: 'horizontal' | 'vertical';
  className?: string;
}> = ({
  icons,
  spacing = 'normal',
  direction = 'horizontal',
  className = ''
}) => {
  const spacings = {
    tight: direction === 'horizontal' ? 'space-x-2' : 'space-y-2',
    normal: direction === 'horizontal' ? 'space-x-4' : 'space-y-4',
    loose: direction === 'horizontal' ? 'space-x-6' : 'space-y-6'
  };
  
  const directionClass = direction === 'horizontal' ? 'flex items-center' : 'flex flex-col';
  
  return (
    <div className={`${directionClass} ${spacings[spacing]} ${className}`}>
      {icons.map((iconConfig, index) => (
        <div key={index} className="flex flex-col items-center">
          <iconConfig.icon
            size={iconConfig.size || 24}
            color={iconConfig.color}
            className="transition-colors duration-200"
          />
          {iconConfig.label && (
            <span className="text-xs text-gray-600 mt-1 text-center">
              {iconConfig.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// === ÍCONO DE ESTADO DE PUNTUACIÓN ===
export const ScoreStatusIcon: React.FC<{
  score: number;
  className?: string;
  size?: number;
}> = ({ score, className = '', size = 24 }) => {
  const getIconAndColor = (score: number) => {
    if (score >= 9) {
      return { 
        icon: '⭐', 
        color: 'text-green-600', 
        bg: 'bg-green-100',
        label: 'Excelente' 
      };
    }
    if (score >= 7) {
      return { 
        icon: '👍', 
        color: 'text-blue-600', 
        bg: 'bg-blue-100',
        label: 'Muy Bueno' 
      };
    }
    if (score >= 5) {
      return { 
        icon: '👌', 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-100',
        label: 'Bueno' 
      };
    }
    if (score >= 3) {
      return { 
        icon: '👎', 
        color: 'text-orange-600', 
        bg: 'bg-orange-100',
        label: 'Satisfactorio' 
      };
    }
    return { 
      icon: '❌', 
      color: 'text-red-600', 
      bg: 'bg-red-100',
      label: 'Insuficiente' 
    };
  };
  
  const { icon, color, bg, label } = getIconAndColor(score);
  
  return (
    <div 
      className={`
        inline-flex items-center justify-center 
        rounded-full p-1 ${bg} ${color} 
        ${className}
      `}
      style={{ 
        width: size, 
        height: size,
        fontSize: size * 0.6 
      }}
      title={`${label}: ${score}/10`}
    >
      {icon}
    </div>
  );
};

// === ÍCONO DE POSICIÓN DE RANKING ===
export const RankingPositionIcon: React.FC<{
  position: number;
  className?: string;
  size?: number;
  animated?: boolean;
}> = ({ position, className = '', size = 32, animated = false }) => {
  const getPositionStyle = (pos: number) => {
    if (pos === 1) {
      return {
        icon: '🥇',
        bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
        text: 'text-yellow-900',
        border: 'border-yellow-300'
      };
    }
    if (pos === 2) {
      return {
        icon: '🥈',
        bg: 'bg-gradient-to-br from-gray-300 to-gray-500',
        text: 'text-gray-900',
        border: 'border-gray-300'
      };
    }
    if (pos === 3) {
      return {
        icon: '🥉',
        bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
        text: 'text-orange-900',
        border: 'border-orange-300'
      };
    }
    return {
      icon: pos.toString(),
      bg: 'bg-gradient-to-br from-blue-100 to-blue-200',
      text: 'text-blue-800',
      border: 'border-blue-200'
    };
  };
  
  const { icon, bg, text, border } = getPositionStyle(position);
  
  return (
    <div 
      className={`
        inline-flex items-center justify-center 
        rounded-full font-bold border-2 shadow-lg
        ${bg} ${text} ${border}
        ${animated ? 'animate-bounce' : ''}
        ${className}
      `}
      style={{ 
        width: size, 
        height: size,
        fontSize: size * 0.4
      }}
    >
      {icon}
    </div>
  );
};

// === ÍCONO DE CONECTIVIDAD ===
export const ConnectivityIcon: React.FC<{
  isOnline: boolean;
  className?: string;
  size?: number;
  showLabel?: boolean;
}> = ({ isOnline, className = '', size = 24, showLabel = false }) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        {isOnline ? (
          <LiveIcon 
            size={size} 
            color="rgb(34, 197, 94)" 
            className="animate-pulse" 
          />
        ) : (
          <OfflineIcon 
            size={size} 
            color="rgb(239, 68, 68)" 
          />
        )}
        <div 
          className={`
            absolute -top-1 -right-1 w-3 h-3 rounded-full 
            ${isOnline ? 'bg-green-500 animate-ping' : 'bg-red-500'}
          `}
        />
      </div>
      {showLabel && (
        <span className={`text-sm font-medium ${
          isOnline ? 'text-green-600' : 'text-red-600'
        }`}>
          {isOnline ? 'En línea' : 'Sin conexión'}
        </span>
      )}
    </div>
  );
};

// === ÍCONO DE CARGA CON PROGRESO ===
export const LoadingIcon: React.FC<{
  progress?: number;
  className?: string;
  size?: number;
  color?: string;
}> = ({ progress, className = '', size = 24, color = 'currentColor' }) => {
  if (progress !== undefined) {
    const circumference = 2 * Math.PI * 8;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    return (
      <div className={`relative ${className}`} style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          viewBox="0 0 20 20"
        >
          <circle
            cx="10"
            cy="10"
            r="8"
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx="10"
            cy="10"
            r="8"
            stroke={color}
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium" style={{ color }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// === EXPORT PRINCIPAL ===
export default EquestrianIcons;