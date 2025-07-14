import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
}

export function Button({ 
  className, 
  variant = 'default', 
  size = 'default', 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50",
        {
          'default': "bg-blue-600 text-white shadow hover:bg-blue-700",
          'outline': "border border-gray-300 bg-white hover:bg-gray-50 hover:text-gray-900",
          'ghost': "hover:bg-gray-100 hover:text-gray-900",
          'secondary': "bg-gray-100 text-gray-900 hover:bg-gray-200"
        }[variant],
        {
          'sm': "h-8 rounded-md px-3 text-xs",
          'default': "h-9 px-4 py-2 text-sm",
          'lg': "h-10 rounded-md px-8"
        }[size],
        className
      )}
      {...props}
    />
  );
}