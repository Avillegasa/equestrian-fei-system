import React from 'react';

interface OfflineWrapperProps {
  children: React.ReactNode;
}

export function OfflineWrapper({ children }: OfflineWrapperProps) {
  return (
    <div>
      {children}
    </div>
  );
}