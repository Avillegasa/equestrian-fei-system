// 🛠️ Utilidades y Helpers - Sistema FEI
// Funciones utilitarias para el sistema de diseño

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// === FUNCIÓN PRINCIPAL PARA COMBINAR CLASES ===
/**
 * Combina clases de Tailwind CSS de manera inteligente
 * Evita conflictos y duplicados usando clsx y tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// === UTILIDADES DE FORMATO ===

/**
 * Formatea puntuaciones FEI con precisión decimal
 */
export function formatFEIScore(score: number): string {
  return score.toFixed(1);
}

/**
 * Formatea porcentajes FEI
 */
export function formatFEIPercentage(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}

/**
 * Formatea números con separadores de miles
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-ES').format(num);
}

/**
 * Formatea fechas en formato local
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
}

/**
 * Formatea tiempo en formato HH:MM
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

// === VALIDACIONES FEI ===

/**
 * Valida si una puntuación cumple con los estándares FEI
 */
export function validateFEIScore(score: number): {
  isValid: boolean;
  error?: string;
  warning?: string;
} {
  // Verificar rango
  if (score < 0 || score > 10) {
    return {
      isValid: false,
      error: 'La puntuación debe estar entre 0 y 10'
    };
  }
  
  // Verificar incrementos de 0.5
  if ((score * 2) % 1 !== 0) {
    return {
      isValid: false,
      error: 'La puntuación debe ser en incrementos de 0.5'
    };
  }
  
  // Verificar puntuaciones extremas
  if (score <= 2) {
    return {
      isValid: true,
      warning: 'Puntuación muy baja - requiere justificación'
    };
  }
  
  if (score >= 9.5) {
    return {
      isValid: true,
      warning: 'Puntuación muy alta - requiere justificación'
    };
  }
  
  return { isValid: true };
}

/**
 * Obtiene la descripción de una puntuación FEI
 */
export function getFEIScoreDescription(score: number): string {
  if (score >= 9) return 'Excelente';
  if (score >= 7) return 'Muy Bueno';
  if (score >= 5) return 'Bueno';
  if (score >= 3) return 'Satisfactorio';
  return 'Insuficiente';
}

/**
 * Obtiene el color correspondiente a una puntuación FEI
 */
export function getFEIScoreColor(score: number): {
  bg: string;
  text: string;
  border: string;
} {
  if (score >= 9) {
    return {
      bg: 'bg-green-50',
      text: 'text-green-800',
      border: 'border-green-300'
    };
  }
  if (score >= 7) {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-300'
    };
  }
  if (score >= 5) {
    return {
      bg: 'bg-yellow-50',
      text: 'text-yellow-800',
      border: 'border-yellow-300'
    };
  }
  if (score >= 3) {
    return {
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-300'
    };
  }
  return {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-300'
  };
}

// === UTILIDADES DE CÁLCULO ===

/**
 * Calcula el porcentaje FEI de una puntuación
 */
export function calculateFEIPercentage(score: number, maxScore: number = 10): number {
  return (score / maxScore) * 100;
}

/**
 * Calcula la puntuación total ponderada
 */
export function calculateWeightedScore(
  scores: Array<{ score: number; coefficient: number }>
): number {
  const totalWeighted = scores.reduce((sum, item) => sum + (item.score * item.coefficient), 0);
  const totalCoefficients = scores.reduce((sum, item) => sum + item.coefficient, 0);
  return totalCoefficients > 0 ? totalWeighted / totalCoefficients : 0;
}

/**
 * Calcula la posición en el ranking basado en puntuación
 */
export function calculateRanking(
  participants: Array<{ id: string; totalScore: number }>
): Array<{ id: string; totalScore: number; position: number }> {
  return participants
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((participant, index) => ({
      ...participant,
      position: index + 1
    }));
}

// === UTILIDADES DE ESTADO ===

/**
 * Genera clases CSS para estados de componentes
 */
export function getStateClasses(state: 'valid' | 'invalid' | 'pending' | 'neutral'): string {
  const stateMap = {
    valid: 'border-green-300 bg-green-50 text-green-800',
    invalid: 'border-red-300 bg-red-50 text-red-800',
    pending: 'border-yellow-300 bg-yellow-50 text-yellow-800',
    neutral: 'border-gray-300 bg-gray-50 text-gray-800'
  };
  
  return stateMap[state] || stateMap.neutral;
}

/**
 * Obtiene el icono apropiado para un estado
 */
export function getStateIcon(state: 'success' | 'error' | 'warning' | 'info'): string {
  const iconMap = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  
  return iconMap[state] || iconMap.info;
}

// === UTILIDADES DE RESPONSIVE ===

/**
 * Genera clases responsive para diferentes dispositivos
 */
export function getResponsiveClasses(
  mobile: string,
  tablet: string,
  desktop: string
): string {
  return `${mobile} md:${tablet} lg:${desktop}`;
}

/**
 * Detecta el tipo de dispositivo basado en el viewport
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// === UTILIDADES DE ANIMACIÓN ===

/**
 * Genera un delay aleatorio para animaciones escalonadas
 */
export function getStaggerDelay(index: number, baseDelay: number = 100): number {
  return index * baseDelay;
}

/**
 * Crea una función de easing personalizada
 */
export function createEasing(type: 'easeInOut' | 'easeIn' | 'easeOut' | 'bounce'): string {
  const easings = {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  };
  
  return easings[type] || easings.easeInOut;
}

// === UTILIDADES DE COLOR ===

/**
 * Convierte un color hex a rgba
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Obtiene un color de contraste apropiado
 */
export function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  return brightness > 128 ? '#000000' : '#FFFFFF';
}

// === UTILIDADES DE ALMACENAMIENTO ===

/**
 * Guarda datos en localStorage de forma segura
 */
export function saveToStorage(key: string, data: any): boolean {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    }
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
  return false;
}

/**
 * Recupera datos de localStorage de forma segura
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window !== 'undefined') {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  return defaultValue;
}

/**
 * Elimina datos de localStorage
 */
export function removeFromStorage(key: string): boolean {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
      return true;
    }
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
  return false;
}

// === UTILIDADES DE DEBOUNCE Y THROTTLE ===

/**
 * Función debounce para optimizar rendimiento
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Función throttle para controlar frecuencia de ejecución
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// === UTILIDADES DE URL Y NAVEGACIÓN ===

/**
 * Construye URLs con parámetros de forma segura
 */
export function buildUrl(base: string, params: Record<string, string | number>): string {
  const url = new URL(base, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  
  return url.toString();
}

/**
 * Extrae parámetros de URL
 */
export function getUrlParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(window.location.search);
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
}

// === UTILIDADES DE TEXTO ===

/**
 * Trunca texto con elipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitaliza la primera letra de cada palabra
 */
export function titleCase(text: string): string {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Convierte texto a slug URL-friendly
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// === UTILIDADES DE VALIDACIÓN ===

/**
 * Valida email con regex
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida número de teléfono
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Valida longitud de contraseña
 */
export function isValidPassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// === UTILIDADES DE ARCHIVO ===

/**
 * Formatea el tamaño de archivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Obtiene la extensión de un archivo
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Valida tipo de archivo
 */
export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = getFileExtension(filename).toLowerCase();
  return allowedTypes.includes(extension);
}

// === UTILIDADES DE FECHA Y TIEMPO ===

/**
 * Calcula diferencia entre fechas
 */
export function getDateDifference(date1: Date, date2: Date): {
  days: number;
  hours: number;
  minutes: number;
} {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
}

/**
 * Formatea tiempo relativo (hace X tiempo)
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Ahora';
  if (diffMinutes < 60) return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  
  return formatDate(targetDate);
}

/**
 * Verifica si una fecha está en el pasado
 */
export function isDateInPast(date: Date | string): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return targetDate.getTime() < new Date().getTime();
}

/**
 * Verifica si una fecha está en el futuro
 */
export function isDateInFuture(date: Date | string): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return targetDate.getTime() > new Date().getTime();
}

// === UTILIDADES DE MATEMÁTICAS ===

/**
 * Redondea a un número específico de decimales
 */
export function roundToDecimals(num: number, decimals: number): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Calcula el promedio de un array de números
 */
export function calculateAverage(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

/**
 * Encuentra el valor máximo en un array
 */
export function findMax(numbers: number[]): number {
  return Math.max(...numbers);
}

/**
 * Encuentra el valor mínimo en un array
 */
export function findMin(numbers: number[]): number {
  return Math.min(...numbers);
}

/**
 * Calcula la mediana de un array de números
 */
export function calculateMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
}

// === UTILIDADES DE ARRAY ===

/**
 * Elimina duplicados de un array
 */
export function removeDuplicates<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Agrupa elementos de un array por una propiedad
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Ordena array por múltiples criterios
 */
export function sortBy<T>(array: T[], ...keys: (keyof T)[]): T[] {
  return array.sort((a, b) => {
    for (const key of keys) {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
}

/**
 * Pagina un array
 */
export function paginate<T>(array: T[], page: number, pageSize: number): {
  data: T[];
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const data = array.slice(startIndex, endIndex);
  const totalPages = Math.ceil(array.length / pageSize);
  
  return {
    data,
    totalPages,
    currentPage: page,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
}

// === UTILIDADES DE PERFORMANCE ===

/**
 * Mide el tiempo de ejecución de una función
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;
  
  console.log(`${name} took ${duration.toFixed(2)}ms`);
  
  return { result, duration };
}

/**
 * Crea un cache simple en memoria
 */
export function createCache<T>(ttl: number = 300000): {
  get: (key: string) => T | null;
  set: (key: string, value: T) => void;
  clear: () => void;
} {
  const cache = new Map<string, { value: T; timestamp: number }>();
  
  return {
    get: (key: string) => {
      const item = cache.get(key);
      if (!item) return null;
      
      if (Date.now() - item.timestamp > ttl) {
        cache.delete(key);
        return null;
      }
      
      return item.value;
    },
    set: (key: string, value: T) => {
      cache.set(key, { value, timestamp: Date.now() });
    },
    clear: () => {
      cache.clear();
    }
  };
}

// === UTILIDADES DE ERROR HANDLING ===

/**
 * Wrapper para manejo seguro de errores
 */
export async function safeAsync<T>(
  promise: Promise<T>
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error as Error];
  }
}

/**
 * Retry automático para funciones que pueden fallar
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
}

// === EXPORT DE CONSTANTES ÚTILES ===

export const EQUESTRIAN_CONSTANTS = {
  SCORE_MIN: 0,
  SCORE_MAX: 10,
  SCORE_STEP: 0.5,
  SCORE_PRECISION: 1,
  PERCENTAGE_PRECISION: 2,
  
  SCORE_DESCRIPTIONS: {
    EXCELLENT: 'Excelente',
    VERY_GOOD: 'Muy Bueno', 
    GOOD: 'Bueno',
    SATISFACTORY: 'Satisfactorio',
    INSUFFICIENT: 'Insuficiente'
  },
  
  SCORE_THRESHOLDS: {
    EXCELLENT: 9,
    VERY_GOOD: 7,
    GOOD: 5,
    SATISFACTORY: 3
  }
};

export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920
};

export const ANIMATION_DURATIONS = {
  fast: 150,
  base: 200,
  slow: 300,
  slower: 500
};

export default {
  cn,
  formatFEIScore,
  formatFEIPercentage,
  validateFEIScore,
  getFEIScoreDescription,
  getFEIScoreColor,
  calculateFEIPercentage,
  calculateWeightedScore,
  getStateClasses,
  debounce,
  throttle,
  EQUESTRIAN_CONSTANTS
};