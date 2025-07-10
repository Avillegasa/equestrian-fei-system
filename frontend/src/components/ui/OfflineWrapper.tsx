'use client';

// frontend/src/components/ui/OfflineWrapper.tsx

import React from 'react';
import { OfflineIndicator, OfflineStatusBar } from './OfflineIndicator';

interface OfflineWrapperProps {
  children: React.ReactNode;
}

export function OfflineWrapper({ children }: OfflineWrapperProps) {
  return (
    <>
      {/* Barra de estado offline */}
      <OfflineStatusBar />
      
      {/* Contenido principal */}
      {children}
      
      {/* Indicador offline en esquina */}
      <OfflineIndicator position="top-right" />
    </>
  );
}