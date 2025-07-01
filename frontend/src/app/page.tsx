export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🏇 Sistema FEI
          </h1>
          <p className="text-gray-600 mb-8">
            Sistema de Gestión de Competencias Ecuestres
          </p>
          
          <div className="space-y-4">
            <a
              href="/auth/login"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Iniciar Sesión
            </a>
            
            <a
              href="/dashboard"
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Ir al Dashboard
            </a>
            
            <a
              href="http://localhost:8000/admin/"
              target="_blank"
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Admin Django ↗
            </a>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-md">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            ✅ Estado del Sistema:
          </h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Frontend: http://localhost:3000</li>
            <li>• Backend: http://localhost:8000</li>
            <li>• Fase 4: Sistema FEI Implementado</li>
          </ul>
        </div>
      </div>
    </div>
  );
}