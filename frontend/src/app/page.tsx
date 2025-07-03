export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Sistema FEI - Fase 4
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Sistema de Calificación y Cálculos FEI
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              🧮 Motor de Cálculo
            </h2>
            <p className="text-gray-600">
              Sistema FEI de 3 celdas implementado con validaciones automáticas
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-green-600 mb-3">
              👨‍⚖️ Interfaz de Juez
            </h2>
            <p className="text-gray-600">
              Optimizada para tablet/móvil con cálculos en tiempo real
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-purple-600 mb-3">
              📊 Rankings
            </h2>
            <p className="text-gray-600">
              Sistema de rankings automático con detección de anomalías
            </p>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            ✅ Backend funcionando correctamente en: 
            <a 
              href="http://localhost:8000/api/scoring/parameters/" 
              target="_blank" 
              className="underline hover:text-blue-600 ml-1"
            >
              localhost:8000/api/scoring/parameters/
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}