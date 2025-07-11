/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // 🎨 PALETA DE COLORES ECUESTRE PREMIUM
      colors: {
        // Colores primarios temáticos
        equestrian: {
          gold: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#D4AF37',  // Oro ecuestre principal
            600: '#B7941F',
            700: '#92740F',
            800: '#78630C',
            900: '#664E0A',
            950: '#3C2E06',
          },
          blue: {
            50: '#EFF6FF',
            100: '#DBEAFE',
            200: '#BFDBFE',
            300: '#93C5FD',
            400: '#60A5FA',
            500: '#3B82F6',
            600: '#1E3A8A',  // Azul noble principal
            700: '#1E40AF',
            800: '#1E3A8A',
            900: '#1E3A8A',
            950: '#0F172A',
          },
          green: {
            50: '#ECFDF5',
            100: '#D1FAE5',
            200: '#A7F3D0',
            300: '#6EE7B7',
            400: '#34D399',
            500: '#059669',  // Verde competencia principal
            600: '#059669',
            700: '#047857',
            800: '#065F46',
            900: '#064E3B',
            950: '#022C22',
          },
        },
        
        // Colores secundarios sofisticados
        secondary: {
          amber: {
            50: '#FFFBEB',
            500: '#F59E0B',
            600: '#D97706',
          },
          slate: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
          },
        },
        
        // Estados mejorados
        status: {
          success: {
            50: '#ECFDF5',
            500: '#10B981',
            600: '#059669',
          },
          warning: {
            50: '#FFFBEB',
            500: '#F59E0B',
            600: '#D97706',
          },
          error: {
            50: '#FEF2F2',
            500: '#EF4444',
            600: '#DC2626',
          },
          info: {
            50: '#EFF6FF',
            500: '#3B82F6',
            600: '#2563EB',
          },
        },
      },
      
      // 📝 TIPOGRAFÍA PROFESIONAL
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Monaco', 'Menlo', 'Consolas', 'monospace'],
        accent: ['Playfair Display', 'serif'],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
        
        // Tamaños específicos para scoring
        'score-sm': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'score-base': ['1.5rem', { lineHeight: '2rem', fontWeight: '700' }],
        'score-lg': ['2rem', { lineHeight: '2.5rem', fontWeight: '800' }],
        'score-xl': ['2.5rem', { lineHeight: '3rem', fontWeight: '800' }],
      },
      
      // 🎨 GRADIENTES TEMÁTICOS
      backgroundImage: {
        'gradient-equestrian': 'linear-gradient(135deg, #D4AF37 0%, #1E3A8A 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FBBF24 0%, #D4AF37 100%)',
        'gradient-success': 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
        'gradient-primary': 'linear-gradient(135deg, #3B82F6 0%, #1E3A8A 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        'gradient-light': 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
        
        // Gradientes para estados
        'gradient-score-excellent': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
        'gradient-score-good': 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
        'gradient-score-fair': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        'gradient-score-poor': 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
      },
      
      // 🌟 SOMBRAS SOFISTICADAS
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'premium': '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 9px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(212, 175, 55, 0.3)',
        'glow-blue': '0 0 20px rgba(30, 58, 138, 0.3)',
        'glow-green': '0 0 20px rgba(5, 150, 105, 0.3)',
        'inner-soft': 'inset 0 1px 4px 0 rgba(0, 0, 0, 0.05)',
        
        // Sombras para estados
        'score-valid': '0 4px 14px 0 rgba(16, 185, 129, 0.25)',
        'score-invalid': '0 4px 14px 0 rgba(239, 68, 68, 0.25)',
        'score-pending': '0 4px 14px 0 rgba(245, 158, 11, 0.25)',
        
        // Sombras para elevación
        'elevation-1': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevation-4': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      
      // 🎭 ANIMACIONES Y TRANSICIONES
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-in-out',
        'pulse-soft': 'pulseSoft 2s infinite',
        'shimmer': 'shimmer 2s infinite',
        'score-update': 'scoreUpdate 0.8s ease-out',
        'ranking-change': 'rankingChange 1s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSoft: {
          '0%': { transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scoreUpdate: {
          '0%': { transform: 'scale(1)', backgroundColor: 'rgba(59, 130, 246, 0.1)' },
          '50%': { transform: 'scale(1.02)', backgroundColor: 'rgba(59, 130, 246, 0.2)' },
          '100%': { transform: 'scale(1)', backgroundColor: 'transparent' },
        },
        rankingChange: {
          '0%': { transform: 'translateY(0)', backgroundColor: 'rgba(212, 175, 55, 0.1)' },
          '50%': { transform: 'translateY(-2px)', backgroundColor: 'rgba(212, 175, 55, 0.2)' },
          '100%': { transform: 'translateY(0)', backgroundColor: 'transparent' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(212, 175, 55, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.6)' },
        },
      },
      
      // 📐 ESPACIADO Y DIMENSIONES
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      
      // 🎯 BORDES REDONDEADOS
      borderRadius: {
        'xs': '0.125rem',
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      
      // 🔍 Z-INDEX SISTEMÁTICO
      zIndex: {
        'tooltip': '1000',
        'modal': '1010',
        'popover': '1020',
        'dropdown': '1030',
        'sticky': '1040',
        'fixed': '1050',
        'overlay': '1060',
        'notification': '1070',
      },
      
      // 📱 BREAKPOINTS OPTIMIZADOS
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
        
        // Breakpoints específicos para tablets de jueces
        'tablet-sm': '768px',
        'tablet-lg': '1024px',
        
        // Breakpoints para displays públicos
        'display': '1920px',
        'display-lg': '2560px',
      },
    },
  },
  plugins: [
    // Plugin para utilidades adicionales
    function({ addUtilities, addComponents, theme }) {
      
      // 🎨 UTILIDADES PERSONALIZADAS
      const newUtilities = {
        // Glassmorphism
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        
        // Text gradients
        '.text-gradient-equestrian': {
          background: 'linear-gradient(135deg, #D4AF37 0%, #1E3A8A 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          backgroundClip: 'text',
        },
        '.text-gradient-gold': {
          background: 'linear-gradient(135deg, #FBBF24 0%, #D4AF37 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          backgroundClip: 'text',
        },
        
        // Focus states mejorados
        '.focus-ring': {
          '&:focus': {
            outline: '2px solid transparent',
            outlineOffset: '2px',
            boxShadow: `0 0 0 3px ${theme('colors.equestrian.gold.500')}40`,
          },
        },
        
        // Loading shimmer
        '.shimmer': {
          background: 'linear-gradient(90deg, #f0f0f0 25%, transparent 37%, #f0f0f0 63%)',
          backgroundSize: '400% 100%',
          animation: 'shimmer 1.5s ease infinite',
        },
        
        // Touch-friendly
        '.touch-target': {
          minHeight: '44px',
          minWidth: '44px',
        },
      };
      
      // 🧩 COMPONENTES BASE
      const newComponents = {
        // Botones premium
        '.btn-premium': {
          '@apply px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform active:scale-95 focus-ring': {},
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        
        // Cards premium
        '.card-premium': {
          '@apply bg-white rounded-2xl shadow-soft border border-gray-100 transition-all duration-200': {},
          '&:hover': {
            '@apply shadow-premium': {},
          },
        },
        
        // Input premium
        '.input-premium': {
          '@apply px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-equestrian-gold-500 focus:ring-0 transition-colors duration-200': {},
        },
        
        // Score input específico
        '.score-input-premium': {
          '@apply input-premium font-mono text-lg font-bold text-center': {},
          '@apply focus:shadow-score-valid focus:border-equestrian-green-500': {},
        },
        
        // Badge premium
        '.badge-premium': {
          '@apply inline-flex items-center px-3 py-1 rounded-full text-sm font-medium': {},
        },
        
        // Progress bar premium
        '.progress-premium': {
          '@apply w-full bg-gray-200 rounded-full h-2 overflow-hidden': {},
          '& .progress-bar': {
            '@apply h-full bg-gradient-equestrian transition-all duration-500 ease-out': {},
          },
        },
      };
      
      addUtilities(newUtilities);
      addComponents(newComponents);
    },
  ],
};