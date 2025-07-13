export default function TestBasicPage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-red-500 mb-4">
        TEST: ¿Se ve este texto rojo?
      </h1>
      
      <div className="bg-blue-500 text-white p-4 rounded mb-4">
        TEST: ¿Se ve este fondo azul?
      </div>
      
      <div className="bg-green-500 text-white p-4 rounded mb-4">
        TEST: ¿Se ve este fondo verde?
      </div>
      
      <button className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
        TEST: ¿Cambia este botón al hacer hover?
      </button>
    </div>
  );
}