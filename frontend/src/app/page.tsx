'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  // Redirección simple sin useEffect
  if (typeof window !== 'undefined') {
    if (isAuthenticated) {
      window.location.replace('/dashboard');
    } else {
      window.location.replace('/auth/login');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}