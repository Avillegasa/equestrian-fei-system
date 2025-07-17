// 📦 UI Components Premium - Sistema FEI (COMPLETAMENTE CORREGIDO)
// Archivo: frontend/src/components/ui/index.tsx

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

// ================ COMPONENTES BÁSICOS ================

// === BUTTON COMPONENT ===
type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'equestrian' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

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
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-md hover:shadow-lg',
      secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 focus:ring-blue-500 shadow-sm hover:shadow-md',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-md hover:shadow-lg',
      danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 shadow-md hover:shadow-lg',
      ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500',
      outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500',
      equestrian: 'bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white focus:ring-amber-500 shadow-lg hover:shadow-xl'
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

// === LABEL COMPONENT ===
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
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

// === LOADING SPINNER ===
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

// === ICONOS ===
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

// === INPUT MEJORADO ===
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  icon?: ReactNode;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, icon, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id}>{label}</Label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">{icon}</span>
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
              icon && 'pl-10', // : false,
              error && 'border-red-500 focus:ring-red-500',
              success && 'border-green-500 focus:ring-green-500',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600">{success}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// === CARD COMPONENTS ===
export const Card = forwardRef<HTMLDivElement, BaseProps>(
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

// === ALERT COMPONENT ===
interface AlertProps extends BaseProps {
  variant?: 'default' | 'destructive' | 'warning' | 'success';
}

export const Alert: React.FC<AlertProps> = ({ 
  className, 
  variant = 'default', 
  children 
}) => {
  const variants = {
    default: 'bg-blue-50 border-blue-200 text-blue-700',
    destructive: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    success: 'bg-green-50 border-green-200 text-green-700'
  };

  return (
    <div className={cn(
      'relative w-full rounded-lg border p-4',
      variants[variant],
      className
    )}>
      {children}
    </div>
  );
};

// ================ COMPONENTES EXISTENTES (mantener tal como están) ================

// === SCORE INPUT ===
interface ScoreInputProps extends InputHTMLAttributes<HTMLInputElement> {
  maxScore?: number;
  coefficient?: number;
  showCoefficient?: boolean;
  onScoreChange?: (score: number) => void;
  error?: string;
}

export const ScoreInput = forwardRef<HTMLInputElement, ScoreInputProps>(
  ({ maxScore = 10, coefficient = 1, showCoefficient = true, onScoreChange, error, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value) && onScoreChange) {
        onScoreChange(value);
      }
      if (props.onChange) {
        props.onChange(e);
      }
    };

    return (
      <div className="space-y-2">
        <div className="relative">
          <input
            ref={ref}
            type="number"
            min="0"
            max={maxScore}
            step="0.5"
            className={cn(
              'w-full px-4 py-3 text-lg font-semibold text-center rounded-xl border-2 transition-all duration-200',
              'focus:ring-4 focus:ring-opacity-50 focus:border-opacity-100',
              error 
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50' 
                : 'border-gray-300 focus:border-equestrian-gold-500 focus:ring-equestrian-gold-500 bg-white hover:bg-gray-50',
              className
            )}
            onChange={handleChange}
            {...props}
          />
          {showCoefficient && coefficient !== 1 && (
            <div className="absolute -top-2 -right-2 bg-equestrian-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              ×{coefficient}
            </div>
          )}
        </div>
        
        {showCoefficient && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Max: {maxScore}</span>
            {coefficient !== 1 && <span>Coef: ×{coefficient}</span>}
          </div>
        )}
        
        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

ScoreInput.displayName = 'ScoreInput';

// === BADGE ===
interface BadgeProps extends BaseProps {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'equestrian';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({ 
  className, 
  variant = 'default', 
  size = 'md', 
  children 
}) => {
  const variants = {
    default: 'bg-blue-100 text-blue-800 border-blue-200',
    secondary: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    destructive: 'bg-red-100 text-red-800 border-red-200',
    equestrian: 'bg-gradient-to-r from-equestrian-gold-100 to-equestrian-blue-100 text-equestrian-blue-800 border-equestrian-gold-200'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-medium border',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
};

// === PROGRESS ===
interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'equestrian';
}

export const Progress: React.FC<ProgressProps> = ({ 
  value, 
  max = 100, 
  className, 
  showPercentage = false,
  variant = 'default'
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const variants = {
    default: 'bg-blue-600',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    equestrian: 'bg-gradient-to-r from-equestrian-gold-500 to-equestrian-blue-600'
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out rounded-full',
            variants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-right">
          <span className="text-sm font-medium text-gray-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

// === RANKING POSITION ===
interface RankingPositionProps {
  position: number;
  participant: string;
  score: number;
  maxScore: number;
  className?: string;
  showPercentage?: boolean;
}

export const RankingPosition: React.FC<RankingPositionProps> = ({
  position,
  participant,
  score,
  maxScore,
  className,
  showPercentage = true
}) => {
  const percentage = (score / maxScore) * 100;
  
  const getPositionColor = (pos: number) => {
    switch (pos) {
      case 1: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 2: return 'text-gray-600 bg-gray-50 border-gray-200';
      case 3: return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md',
      getPositionColor(position),
      className
    )}>
      <div className="flex items-center space-x-4">
        <div className="text-2xl font-bold">
          #{position}
        </div>
        <div>
          <h3 className="font-semibold">{participant}</h3>
          <div className="flex items-center space-x-2 text-sm">
            <span>{score.toFixed(2)} pts</span>
            {showPercentage && <span>({percentage.toFixed(1)}%)</span>}
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <Progress 
          value={score} 
          max={maxScore} 
          className="w-32" 
          variant={position <= 3 ? 'equestrian' : 'default'}
        />
      </div>
    </div>
  );
};

// === SKELETON ===
export const Skeleton: React.FC<BaseProps> = ({ className }) => (
  <div className={cn('animate-pulse rounded-md bg-gray-200', className)} />
);

// === NOTIFICATION ===
interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  isVisible: boolean;
  onClose?: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose
}) => {
  const types = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border-2 shadow-lg transition-all duration-300',
      types[type]
    )}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm mt-1">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

// === GLASS CARD ===
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

// === SCORE STATUS ICON ===
export const ScoreStatusIcon: React.FC<{
  status: 'pending' | 'completed' | 'review' | 'approved';
  className?: string;
}> = ({ status, className }) => {
  const statusConfig = {
    pending: { icon: '⏳', color: 'text-gray-500' },
    completed: { icon: '✅', color: 'text-green-600' },
    review: { icon: '🔍', color: 'text-yellow-600' },
    approved: { icon: '✨', color: 'text-blue-600' }
  };

  const config = statusConfig[status];

  return (
    <span className={cn('text-xl', config.color, className)}>
      {config.icon}
    </span>
  );
};

// === CONNECTIVITY ICON ===
export const ConnectivityIcon: React.FC<{
  isOnline: boolean;
  showLabel?: boolean;
  className?: string;
}> = ({ isOnline, showLabel = false, className }) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="relative">
        <span className={cn(
          'inline-block w-3 h-3 rounded-full',
          isOnline ? 'bg-green-500' : 'bg-red-500'
        )}>
          <span className={cn(
            'absolute inset-0 w-3 h-3 rounded-full',
            isOnline ? 'bg-green-500 animate-ping' : 'bg-red-500'
          )} />
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

// === LOADING ICON ===
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

// === TABLE ===
export const Table: React.FC<{
  headers: string[];
  data: Array<Record<string, any>>;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}> = ({ headers, data, className, striped = true, hoverable = true }) => {
  return (
    <div className={cn('overflow-hidden rounded-xl shadow-lg', className)}>
      <table className="w-full border-collapse bg-white">
        <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
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

// === MODAL ===
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
                <span className="w-6 h-6 text-gray-400">✕</span>
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

// === TOOLTIP ===
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
  CardHeader,
  CardContent,
  CardFooter,
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
};