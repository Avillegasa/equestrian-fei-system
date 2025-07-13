// Página de prueba simplificada sin errores de hidratación
// src/app/test-design/page.tsx

"use client";

export default function TestDesignPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      
      {/* === TEST DIRECTO CSS === */}
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        
        {/* Header principal */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gradient-primary mb-4">
            🧪 Sistema de Diseño Premium FEI
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Página de prueba para verificar todos los componentes y estilos
          </p>
        </div>

        {/* === TESTS BÁSICOS === */}
        <div className="space-y-4">
          <div className="test-gold">
            🧪 TEST: ¿Se ve este fondo dorado?
          </div>
          
          <div className="test-gradient">
            🧪 TEST: ¿Se ve este gradiente de oro a azul?
          </div>
          
          <button className="test-hover bg-gray-200 p-4 rounded">
            🧪 TEST: Hover aquí - ¿Cambia de color?
          </button>
          
          <div className="bg-red-500 text-white p-4 rounded">
            🧪 TEST: ¿Se ve este fondo rojo (Tailwind básico)?
          </div>
        </div>

        {/* === TEST COLORES TAILWIND PERSONALIZADOS === */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-6">🎨 Colores Ecuestre</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Colores Primarios */}
            <div>
              <h3 className="font-semibold mb-3">Colores Primarios</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-equestrian-gold-500 rounded-full shadow-lg"></div>
                  <span className="text-sm">Oro Ecuestre</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-equestrian-blue-500 rounded-full shadow-lg"></div>
                  <span className="text-sm">Azul Noble</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-equestrian-green-500 rounded-full shadow-lg"></div>
                  <span className="text-sm">Verde Competencia</span>
                </div>
              </div>
            </div>

            {/* Gradientes */}
            <div>
              <h3 className="font-semibold mb-3">Gradientes</h3>
              <div className="space-y-2">
                <div className="h-8 gradient-equestrian rounded-lg shadow-lg"></div>
                <div className="h-8 gradient-success rounded-lg shadow-lg"></div>
                <div className="h-8 gradient-warning rounded-lg shadow-lg"></div>
              </div>
            </div>

            {/* Badges Simples */}
            <div>
              <h3 className="font-semibold mb-3">Badges</h3>
              <div className="space-y-2">
                <div className="badge badge-success">Excelente</div>
                <div className="badge badge-info">Muy Bueno</div>
                <div className="badge badge-warning">Bueno</div>
                <div className="badge badge-error">Insuficiente</div>
              </div>
            </div>
          </div>
        </div>

        {/* === TEST BOTONES === */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-6">🔘 Botones</h2>
          
          <div className="space-y-6">
            {/* Variantes */}
            <div>
              <h3 className="font-semibold mb-3">Variantes</h3>
              <div className="flex flex-wrap gap-3">
                <button className="btn btn-primary">Primario</button>
                <button className="btn btn-secondary">Secundario</button>
                <button className="btn btn-success">Éxito</button>
                <button className="btn btn-danger">Peligro</button>
                <button className="btn btn-ghost">Fantasma</button>
              </div>
            </div>

            {/* Tamaños */}
            <div>
              <h3 className="font-semibold mb-3">Tamaños</h3>
              <div className="flex flex-wrap items-center gap-3">
                <button className="btn btn-primary btn-sm">Pequeño</button>
                <button className="btn btn-primary">Mediano</button>
                <button className="btn btn-primary btn-lg">Grande</button>
              </div>
            </div>
          </div>
        </div>

        {/* === TEST INPUTS === */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-6">📝 Inputs</h2>
          
          <div className="space-y-4 max-w-md">
            <input 
              type="text" 
              placeholder="Input normal" 
              className="input"
            />
            <input 
              type="text" 
              placeholder="Input éxito" 
              className="input input-success"
              defaultValue="Validado ✓"
            />
            <input 
              type="text" 
              placeholder="Input error" 
              className="input input-error"
              defaultValue="Error en validación"
            />
            <input 
              type="number" 
              placeholder="8.5" 
              className="score-input"
              defaultValue="8.5"
            />
          </div>
        </div>

        {/* === TEST RANKING === */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-6">🏆 Rankings</h2>
          
          <div className="flex items-center space-x-4">
            <div className="ranking-position-1">1</div>
            <div className="ranking-position-2">2</div>
            <div className="ranking-position-3">3</div>
            <div className="ranking-position-other">4</div>
            <div className="ranking-position-other">5</div>
          </div>
        </div>

        {/* === TEST TABLA === */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-6">📊 Tabla Premium</h2>
          
          <table className="table-premium">
            <thead>
              <tr>
                <th>Posición</th>
                <th>Jinete</th>
                <th>Caballo</th>
                <th>Puntuación</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><div className="ranking-position-1">1</div></td>
                <td>María González</td>
                <td>Tornado</td>
                <td className="font-mono font-bold">8.5</td>
              </tr>
              <tr>
                <td><div className="ranking-position-2">2</div></td>
                <td>Carlos Ruiz</td>
                <td>Estrella</td>
                <td className="font-mono font-bold">8.2</td>
              </tr>
              <tr>
                <td><div className="ranking-position-3">3</div></td>
                <td>Ana Martín</td>
                <td>Rayo</td>
                <td className="font-mono font-bold">7.9</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* === TEST PROGRESS === */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-6">📈 Progress Bars</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Progreso de Competencia</span>
                <span className="text-sm text-gray-500">75%</span>
              </div>
              <div className="progress-container">
                <div className="progress-bar" style={{width: '75%'}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* === TEST NOTIFICACIONES === */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold mb-6">🔔 Notificaciones</h2>
          
          <div className="space-y-4">
            <div className="notification-success p-4 rounded-lg relative">
              <div className="font-semibold text-green-800">¡Éxito!</div>
              <div className="text-green-600">Puntuación guardada correctamente</div>
            </div>
            
            <div className="notification-error p-4 rounded-lg relative">
              <div className="font-semibold text-red-800">Error</div>
              <div className="text-red-600">No se pudo conectar con el servidor</div>
            </div>
          </div>
        </div>

        {/* === RESUMEN === */}
        <div className="card p-6 bg-gradient-to-r from-equestrian-gold-50 to-equestrian-blue-50">
          <h2 className="text-2xl font-bold mb-4">✅ Resumen de Tests</h2>
          <p className="text-gray-700">
            Si puedes ver todos los elementos anteriores con los colores y estilos correctos, 
            entonces el sistema de diseño está funcionando perfectamente.
          </p>
          
          <div className="mt-4 flex space-x-2">
            <div className="badge badge-success">CSS ✓</div>
            <div className="badge badge-success">Tailwind ✓</div>
            <div className="badge badge-success">Componentes ✓</div>
            <div className="badge badge-primary">Subfase 6.5.1 ✓</div>
          </div>
        </div>

      </div>
    </div>
  );
}