// 🏆 RankingPosition Corregido - SIN problemas de hidratación
// Archivo: frontend/src/components/ui/RankingPosition.tsx

'use client';

import React from 'react';

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface RankingPositionProps {
  position: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

export const RankingPosition: React.FC<RankingPositionProps> = ({
  position,
  size = 'md',
  animated = false,
  className
}) => {
  // ✅ SOLUCIÓN: Solo usar números, sin emojis
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
    <div className={cn(
      'inline-flex items-center justify-center rounded-full font-bold',
      sizes[size],
      getPositionStyle(position),
      animated && 'animate-bounce',
      className
    )}>
      {position}
    </div>
  );
};

export default RankingPosition;