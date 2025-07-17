// 📦 UI Components Premium - Sistema FEI (CORREGIDO)
// Archivo: frontend/src/components/ui/index.tsx (CAMBIAR EXTENSIÓN A .tsx)

import React, { forwardRef, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// === FUNCIÓN UTILITY PARA COMBINAR CLASES ===
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// === TIPOS Y INTERFACES ===
interface BaseProps {
  className?: string;
  children?: ReactNode;
}

interface IconProps {
  className?: string;
  size?: number;
}

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'equestrian';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gray' | 'equestrian';
type AlertVariant = 'success' | 'warning' | 'error' | 'info';

// === ÍCONOS SIMPLES INTERNOS ===
const CheckIcon: React.FC<IconProps> = ({ className = "", size = 16 }) => {
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    className: className
  }, React.createElement('polyline', { points: "20,6 9,17 4,12" }));
};

const XMarkIcon: React.FC<IconProps> = ({ className = "", size = 16 }) => {
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    className: className
  }, 
    React.createElement('line', { x1: "18", y1: "6", x2: "6", y2: "18" }),
    React.createElement('line', { x1: "6", y1: "6", x2: "18", y2: "18" })
  );
};

const ChevronDownIcon: React.FC<IconProps> = ({ className = "", size = 16 }) => {
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    className: className
  }, React.createElement('polyline', { points: "6,9 12,15 18,9" }));
};

const ExclamationTriangleIcon: React.FC<IconProps> = ({ className = "", size = 16 }) => {
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    className: className
  }, 
    React.createElement('path', { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" }),
    React.createElement('path', { d: "M12 9v4" }),
    React.createElement('path', { d: "m12 17 .01 0" })
  );
};

const InformationCircleIcon: React.FC<IconProps> = ({ className = "", size = 16 }) => {
  return React.createElement('svg', {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    className: className
  }, 
    React.createElement('circle', { cx: "12", cy: "12", r: "10" }),
    React.createElement('path', { d: "m9,12 2,2 4,-4" })
  );
};

// === BUTTON PREMIUM ===
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';
    
    const variants = {
      primary: 'bg-equestrian-gold-500 hover:bg-equestrian-gold-600 text-white focus:ring-equestrian-gold-500 shadow-md hover:shadow-lg hover:-translate-y-0.5',
      secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-equestrian-blue-500 shadow-sm hover:shadow-md hover:-translate-y-0.5',
      success: 'bg-equestrian-green-500 hover:bg-equestrian-green-600 text-white focus:ring-equestrian-green-500 shadow-md hover:shadow-lg hover:-translate-y-0.5',
      danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 shadow-md hover:shadow-lg hover:-translate-y-0.5',
      ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500',
      equestrian: 'bg-gradient-to-r from-equestrian-gold-500 to-equestrian-blue-600 hover:from-equestrian-gold-600 hover:to-equestrian-blue-700 text-white focus:ring-equestrian-gold-500 shadow-lg hover:shadow-xl hover:-translate-y-1'
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg'
    };
    
    return (
      <button
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {icon && !loading && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

// === INPUT PREMIUM ===
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  icon?: ReactNode;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, icon, className, ...props }, ref) => {
    const baseClasses = 'w-full px-4 py-3 text-sm border rounded-lg transition-all duration-200 placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed';
    
    const stateClasses = error 
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
      : success
      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
      : 'border-gray-300 focus:ring-equestrian-gold-500 focus:border-transparent focus:ring-2';
    
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{icon}</span>
            </div>
          )}
          <input
            ref={ref}
            className={cn(baseClasses, stateClasses, icon && 'pl-10', className)}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 flex items-center">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-600 flex items-center">
            <CheckIcon className="w-4 h-4 mr-1" />
            {success}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// === SCORE INPUT ESPECIALIZADO ===
interface ScoreInputProps extends Omit<InputProps, 'type'> {
  value?: number | string;
  onScoreChange?: (score: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showQuickSelect?: boolean;
}

export const ScoreInput = forwardRef<HTMLInputElement, ScoreInputProps>(
  ({ value, onScoreChange, min = 0, max = 10, step = 0.5, showQuickSelect = true, className, ...props }, ref) => {
    const [showDropdown, setShowDropdown] = React.useState(false);
    
    const quickScores = [];
    for (let i = min; i <= max; i += step) {
      quickScores.push(i);
    }
    
    const getScoreColor = (score: number) => {
      if (score >= 9) return 'text-green-700 bg-green-50 border-green-300';
      if (score >= 7) return 'text-blue-700 bg-blue-50 border-blue-300';
      if (score >= 5) return 'text-yellow-700 bg-yellow-50 border-yellow-300';
      if (score >= 3) return 'text-orange-700 bg-orange-50 border-orange-300';
      return 'text-red-700 bg-red-50 border-red-300';
    };
    
    const getScoreLabel = (score: number) => {
      if (score >= 9) return 'Excelente';
      if (score >= 7) return 'Muy Bueno';
      if (score >= 5) return 'Bueno';
      if (score >= 3) return 'Satisfactorio';
      return 'Insuficiente';
    };
    
    const currentScore = typeof value === 'number' ? value : parseFloat(value as string) || 0;
    
    return (
      <div className="relative">
        <div className="flex items-center space-x-2">
          <input
            ref={ref}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onScoreChange?.(parseFloat(e.target.value))}
            className={cn(
              'score-input font-mono text-xl font-bold text-center w-20 h-12',
              currentScore && getScoreColor(currentScore),
              className
            )}
            {...props}
          />
          
          {showQuickSelect && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="h-12 px-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronDownIcon size={16} />
              </button>
              
              {showDropdown && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-premium border border-gray-200 z-50 max-h-60 overflow-y-auto">
                  <div className="p-2">
                    <div className="grid grid-cols-4 gap-1">
                      {quickScores.map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => {
                            onScoreChange?.(score);
                            setShowDropdown(false);
                          }}
                          className={cn(
                            'px-2 py-1 rounded-md text-sm font-medium transition-colors',
                            score === currentScore ? getScoreColor(score) : 'hover:bg-gray-100'
                          )}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    
                    {currentScore > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-600 text-center">
                          {getScoreLabel(currentScore)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {showDropdown && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    );
  }
);

ScoreInput.displayName = 'ScoreInput';

// === CARD PREMIUM ===
interface CardProps extends BaseProps {
  header?: ReactNode;
  footer?: ReactNode;
  interactive?: boolean;
  highlighted?: boolean;
  variant?: 'default' | 'equestrian' | 'success' | 'warning' | 'error';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  header, 
  footer, 
  interactive, 
  highlighted, 
  variant = 'default',
  onClick,
  className, 
  children 
}) => {
  const baseClasses = 'bg-white rounded-xl border shadow-soft transition-all duration-200';
  const variants = {
    default: 'border-gray-200 hover:shadow-premium',
    equestrian: 'border-equestrian-gold-300 bg-gradient-to-br from-white to-equestrian-gold-50 shadow-glow',
    success: 'border-green-200 bg-gradient-to-br from-white to-green-50',
    warning: 'border-yellow-200 bg-gradient-to-br from-white to-yellow-50',
    error: 'border-red-200 bg-gradient-to-br from-white to-red-50'
  };
  
  const interactiveClasses = interactive ? 'cursor-pointer hover:-translate-y-1' : '';
  const highlightedClasses = highlighted ? variants.equestrian : variants[variant];
  
  return (
    <div 
      className={cn(baseClasses, highlightedClasses, interactiveClasses, className)}
      onClick={onClick}
    >
      {header && (
        <div className="p-6 border-b border-gray-200">
          {header}
        </div>
      )}
      
      <div className="p-6">
        {children}
      </div>
      
      {footer && (
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
};


// === CARD COMPONENTS ===
interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, BaseProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-gray-200 bg-white shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';

export const CardHeader: React.FC<BaseProps> = ({ className, children }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)}>
    {children}
  </div>
);

export const CardContent: React.FC<BaseProps> = ({ className, children }) => (
  <div className={cn("p-6 pt-0", className)}>
    {children}
  </div>
);

export const CardFooter: React.FC<BaseProps> = ({ className, children }) => (
  <div className={cn("flex items-center p-6 pt-0", className)}>
    {children}
  </div>
);

// === BADGE PREMIUM ===
interface BadgeProps extends BaseProps {
  variant?: BadgeVariant;
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'primary', 
  icon, 
  size = 'md',
  className, 
  children 
}) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium border';
  
  const variants = {
    primary: 'bg-equestrian-gold-100 text-equestrian-gold-800 border-equestrian-gold-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    equestrian: 'bg-gradient-to-r from-equestrian-gold-100 to-equestrian-blue-100 text-equestrian-blue-800 border-equestrian-gold-200'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };
  
  return (
    <span className={cn(baseClasses, variants[variant], sizes[size], className)}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </span>
  );
};

// === PROGRESS BAR PREMIUM ===
interface ProgressProps extends BaseProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  variant?: 'default' | 'equestrian' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  showLabel = false,
  showPercentage = false,
  variant = 'default',
  size = 'md',
  animated = true,
  className,
  children
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const containerSizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  const variants = {
    default: 'bg-gradient-to-r from-equestrian-gold-500 to-equestrian-blue-600',
    equestrian: 'bg-gradient-to-r from-equestrian-gold-500 to-equestrian-blue-600',
    success: 'bg-gradient-to-r from-equestrian-green-500 to-equestrian-green-600',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    error: 'bg-gradient-to-r from-red-500 to-red-600'
  };
  
  return (
    <div className={cn('w-full', className)}>
      {(showLabel || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {showLabel && (
            <span className="text-sm font-medium text-gray-700">
              {children}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-600">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden shadow-inner',
        containerSizes[size]
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden',
            variants[variant],
            animated && 'animate-pulse'
          )}
          style={{ width: `${percentage}%` }}
        >
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
          )}
        </div>
      </div>
    </div>
  );
};

// === ALERT PREMIUM ===
interface AlertProps extends BaseProps {
  variant?: AlertVariant;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  icon,
  className,
  children
}) => {
  const variants = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: <CheckIcon className="w-5 h-5 text-green-600" />,
      title: 'text-green-800'
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />,
      title: 'text-yellow-800'
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />,
      title: 'text-red-800'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <InformationCircleIcon className="w-5 h-5 text-blue-600" />,
      title: 'text-blue-800'
    }
  };
  
  const variantConfig = variants[variant];
  
  return (
    <div className={cn(
      'rounded-xl border p-4 shadow-soft animate-fade-in-up',
      variantConfig.container,
      className
    )}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {icon || variantConfig.icon}
        </div>
        
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={cn('text-sm font-semibold mb-1', variantConfig.title)}>
              {title}
            </h3>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        
        {dismissible && (
          <div className="ml-3 flex-shrink-0">
            <button
              onClick={onDismiss}
              className="inline-flex rounded-md p-1.5 transition-colors hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// === COMPONENTES SIMPLES SIN JSX ===
export const Skeleton: React.FC<{
  variant?: 'text' | 'rectangle' | 'circle' | 'card';
  lines?: number;
  width?: string;
  height?: string;
  className?: string;
}> = ({ variant = 'text', lines = 1, width, height, className }) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClasses, 'h-4', className)}
            style={{ 
              width: i === lines - 1 ? '75%' : width || '100%' 
            }}
          />
        ))}
      </div>
    );
  }
  
  if (variant === 'circle') {
    return (
      <div
        className={cn(baseClasses, 'rounded-full', className)}
        style={{ 
          width: width || '40px',
          height: height || width || '40px'
        }}
      />
    );
  }
  
  return (
    <div
      className={cn(baseClasses, className)}
      style={{ 
        width: width || '100%',
        height: height || '20px'
      }}
    />
  );
};

export const RankingPosition: React.FC<{
  position: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}> = ({ position, size = 'md', animated = false, className }) => {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
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
  
  if (!mounted) {
    return (
      <div className={cn(
        'inline-flex items-center justify-center rounded-full font-bold',
        sizes[size],
        getPositionStyle(position),
        className
      )}>
        {position}
      </div>
    );
  }
  
  return (
    <div className={cn(
      'inline-flex items-center justify-center rounded-full font-bold',
      sizes[size],
      getPositionStyle(position),
      animated && 'animate-bounce',
      className
    )}>
      {position <= 3 ? (position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉') : position}
    </div>
  );
};

// === COMPONENTES BÁSICOS ADICIONALES ===
export const Notification: React.FC<{
  title?: string;
  variant?: AlertVariant;
  position?: string;
  duration?: number;
  onClose?: () => void;
  show?: boolean;
  className?: string;
  children?: ReactNode;
}> = ({ title, variant = 'info', show = true, onClose, className, children }) => {
  const [isVisible, setIsVisible] = React.useState(show);
  
  React.useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);
  
  if (!isVisible) return null;
  
  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 max-w-sm w-full',
      'bg-white rounded-xl shadow-lg border p-4',
      'animate-slide-in',
      className
    )}>
      <div className="flex items-start">
        <div className="flex-1">
          {title && (
            <h4 className="text-sm font-semibold mb-1">
              {title}
            </h4>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        
        <button
          onClick={() => {
            setIsVisible(false);
            onClose?.();
          }}
          className="ml-3 flex-shrink-0 rounded-md p-1 hover:bg-gray-100 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Componentes adicionales simples
export const ScoreStatusIcon: React.FC<{
  score: number;
  className?: string;
  size?: number;
}> = ({ score, className = '', size = 24 }) => {
  const getStatusEmoji = (score: number) => {
    if (score >= 9) return '⭐';
    if (score >= 7) return '👍';
    if (score >= 5) return '👌';
    if (score >= 3) return '👎';
    return '❌';
  };
  
  return (
    <div 
      className={cn('inline-flex items-center justify-center rounded-full p-1', className)}
      style={{ width: size, height: size, fontSize: size * 0.6 }}
      title={`Score: ${score}/10`}
    >
      {getStatusEmoji(score)}
    </div>
  );
};

export const ConnectivityIcon: React.FC<{
  isOnline: boolean;
  showLabel?: boolean;
  className?: string;
}> = ({ isOnline, showLabel = false, className = '' }) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="relative">
        <span className="text-lg">
          {isOnline ? '🟢' : '🔴'}
        </span>
      </div>
      {showLabel && (
        <span className={cn(
          'text-sm font-medium',
          isOnline ? 'text-green-600' : 'text-red-600'
        )}>
          {isOnline ? 'En línea' : 'Sin conexión'}
        </span>
      )}
    </div>
  );
};

export const LoadingIcon: React.FC<{
  progress?: number;
  className?: string;
  size?: number;
}> = ({ progress, className = '', size = 24 }) => {
  if (progress !== undefined) {
    return (
      <div className={cn('relative', className)} style={{ width: size, height: size }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn('animate-spin', className)} style={{ width: size, height: size }}>
      ⟳
    </div>
  );
};

export const Table: React.FC<{
  headers: string[];
  data: Array<Record<string, any>>;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}> = ({ headers, data, className, striped = true, hoverable = true }) => {
  return (
    <div className={cn('overflow-hidden rounded-xl shadow-soft', className)}>
      <table className="w-full border-collapse bg-white">
        <thead className="bg-gradient-to-r from-equestrian-gold-50 to-equestrian-blue-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                'border-b border-gray-100',
                striped && rowIndex % 2 === 1 && 'bg-gray-25',
                hoverable && 'hover:bg-gray-50 transition-colors duration-150'
              )}
            >
              {headers.map((header, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-6 py-4 text-sm text-gray-900"
                >
                  {row[header.toLowerCase()] || row[header] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ isOpen, onClose, title, children, className, size = 'md' }) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={cn(
          'relative w-full transform rounded-xl bg-white shadow-lg transition-all',
          sizes[size],
          className
        )}>
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="rounded-md p-1 hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          )}
          
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export const Tooltip: React.FC<{
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}> = ({ content, children, position = 'top', className }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  
  const positions = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && (
        <div className={cn(
          'absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg whitespace-nowrap',
          positions[position],
          className
        )}>
          {content}
        </div>
      )}
    </div>
  );
};

export const GlassCard: React.FC<{
  header?: ReactNode;
  footer?: ReactNode;
  blur?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: ReactNode;
}> = ({ header, footer, blur = 'md', className, children }) => {
  const blurClasses = {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg'
  };
  
  return (
    <div className={cn(
      'rounded-xl border border-white border-opacity-20 shadow-lg',
      'bg-white bg-opacity-10',
      blurClasses[blur],
      className
    )}>
      {header && (
        <div className="p-6 border-b border-white border-opacity-20">
          {header}
        </div>
      )}
      
      <div className="p-6">
        {children}
      </div>
      
      {footer && (
        <div className="p-6 border-t border-white border-opacity-20">
          {footer}
        </div>
      )}
    </div>
  );
};


// Label component
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
);
Label.displayName = "Label";

// LoadingSpinner component
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '', 
  color = 'currentColor' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
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

// Icons
export const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

export const EyeOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

export const HorseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

export const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

/* // === EXPORT ALL COMPONENTS ===
export {
  Button,
  Label,
  LoadingSpinner,
  EyeIcon,
  EyeOffIcon,
  HorseIcon,
  TrophyIcon,
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
}; */

// === EXPORT DEFAULT ===
export default {
  Button,
  Label,
  LoadingSpinner,
  EyeIcon,
  EyeOffIcon,
  HorseIcon,
  TrophyIcon,
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
  Tooltip,
  CardHeader,
  CardContent,
  CardFooter
};