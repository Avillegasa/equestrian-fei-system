'use client';

// frontend/src/components/ui/OfflineIndicator.tsx - VERSIÓN SUPER SIMPLE

import React from 'react';
import { useOffline } from '@/hooks/useOffline';

export function OfflineIndicator() {
  const { isOnline, pendingActions } = useOffline();

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="px-3 py-2 rounded-lg shadow-lg bg-white border border-gray-200">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium text-gray-900">
            {isOnline ? 'Online' : 'Offline'}
          </span>
          {pendingActions.length > 0 && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
              {pendingActions.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function OfflineStatusBar() {
  const { isOnline, pendingActions } = useOffline();

  if (isOnline && pendingActions.length === 0) {
    return null;
  }

  return (
    <div className={`w-full px-4 py-2 text-center text-sm font-medium ${
      !isOnline ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
    }`}>
      {!isOnline ? (
        <span>📵 Trabajando sin conexión</span>
      ) : (
        <span>🕐 {pendingActions.length} cambios pendientes</span>
      )}
    </div>
  );
}