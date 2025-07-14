import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        {
          'default': "border-transparent bg-blue-600 text-white shadow hover:bg-blue-700",
          'secondary': "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
          'outline': "text-gray-950 border-gray-200"
        }[variant],
        className
      )}
      {...props}
    />
  );
}