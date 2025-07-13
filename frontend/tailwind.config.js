/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'equestrian-gold': {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#D4AF37', // Color principal
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        'equestrian-blue': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1E3A8A', // Color principal
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        'equestrian-green': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#059669', // Color principal
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Agregamos grises personalizados para gray-25
        gray: {
          25: '#fcfcfd',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Monaco', 'monospace'],
        'accent': ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'premium': '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 9px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(212, 175, 55, 0.3)',
        'score-valid': '0 0 0 3px rgba(5, 150, 105, 0.1)',
        'score-invalid': '0 0 0 3px rgba(239, 68, 68, 0.1)',
        'score-pending': '0 0 0 3px rgba(245, 158, 11, 0.1)',
        'elevation-1': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'shimmer': 'shimmer 1.5s ease infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'score-update': 'scoreUpdate 0.8s ease-out',
        'ranking-change': 'rankingChange 1s ease-in-out',
      },
      zIndex: {
        'notification': '9999',
        'modal': '10000',
        'dropdown': '1000',
        'header': '100',
        'sidebar': '90',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fadeInUp': {
          'from': { 
            opacity: '0',
            transform: 'translateY(20px)'
          },
          'to': { 
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        'scoreUpdate': {
          '0%': {
            transform: 'scale(1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          },
          '50%': {
            transform: 'scale(1.05)',
            backgroundColor: 'rgba(59, 130, 246, 0.2)'
          },
          '100%': {
            transform: 'scale(1)',
            backgroundColor: 'transparent'
          },
        },
        'rankingChange': {
          '0%': {
            transform: 'translateY(0)',
            backgroundColor: 'rgba(212, 175, 55, 0.1)'
          },
          '50%': {
            transform: 'translateY(-4px)',
            backgroundColor: 'rgba(212, 175, 55, 0.2)'
          },
          '100%': {
            transform: 'translateY(0)',
            backgroundColor: 'transparent'
          },
        },
      },
    },
  },
  plugins: [],
}