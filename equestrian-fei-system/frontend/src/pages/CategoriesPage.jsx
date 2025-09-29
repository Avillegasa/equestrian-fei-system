import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCompetitionStore from '../store/competitionStore';
import CreateCategoryModal from '../components/CreateCategoryModal';

const CategoriesPage = () => {
  const { user, logout } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Usar store en lugar de estado local
  const {
    categories,
    categoriesLoading: loading,
    error,
    loadCategories,
    createCategory
  } = useCompetitionStore();

  const handleLogout = async () => {
    await logout();
  };

  // Cargar categorías reales del store
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleCreateCategory = async (categoryData) => {
    try {
      const result = await createCategory(categoryData);
      if (result.success) {
        alert('✅ Categoría creada exitosamente!');
        setShowCreateModal(false);
      } else {
        alert('❌ Error al crear categoría: ' + (result.error?.detail || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error creando categoría:', error);
      alert('❌ Error al crear categoría: ' + error.message);
    }
  };

  const getCategoryTypeDisplay = (type) => {
    const types = {
      age: 'Por Edad',
      level: 'Por Nivel',
      height: 'Por Altura',
      mixed: 'Mixta'
    };
    return types[type] || type;
  };

  const getLevelDisplay = (level) => {
    const levels = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      professional: 'Profesional',
      international: 'Internacional'
    };
    return levels[level] || level;
  };

  const getLevelColor = (level) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-blue-100 text-blue-800',
      advanced: 'bg-yellow-100 text-yellow-800',
      professional: 'bg-purple-100 text-purple-800',
      international: 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Profesional */}
      <header className="bg-white shadow-lg border-b-4 border-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/competitions"
                className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors duration-200 bg-purple-50 px-3 py-2 rounded-lg"
              >
                <span>←</span>
                <span className="font-medium">Competencias</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">📋</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h1>
                  <p className="text-sm text-gray-600">Sistema FEI - Categorías Oficiales</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-600">Gestor de Categorías</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <span>🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {/* Stats Cards Profesionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Categorías</p>
                <p className="text-3xl font-bold text-gray-900">{categories.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">📋</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-purple-600 font-medium">
                Sistema FEI
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Por Altura</p>
                <p className="text-3xl font-bold text-gray-900">
                  {categories.filter(c => c.category_type === 'height').length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-blue-600 font-medium">
                Categorías técnicas
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Por Nivel</p>
                <p className="text-3xl font-bold text-gray-900">
                  {categories.filter(c => c.category_type === 'level').length}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-yellow-600 font-medium">
                Experiencia
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activas</p>
                <p className="text-3xl font-bold text-gray-900">
                  {categories.filter(c => c.is_active).length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">✅</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600 font-medium">
                En uso
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-xl shadow-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400 text-xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error en el sistema</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                  onClick={() => loadCategories()}
                  className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  🔄 Reintentar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categories Table */}
        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Categorías FEI Oficiales
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Gestiona las categorías disponibles para competencias ecuestres
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {categories.length} Total
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {categories.filter(c => c.is_active).length} Activas
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-lg font-medium text-gray-700">Cargando categorías...</p>
                <p className="text-sm text-gray-500">Conectando con el sistema FEI</p>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="text-6xl mb-4 block">📋</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay categorías registradas</h3>
              <p className="text-gray-500 mb-6">Comienza creando tu primera categoría FEI</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                + Crear Primera Categoría
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {categories.map((category) => (
                <div key={category.id} className="px-6 py-5 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">
                            {category.category_type === 'height' ? '🎯' :
                             category.category_type === 'level' ? '⭐' :
                             category.category_type === 'age' ? '👶' : '📋'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {category.name} ({category.code})
                          </h4>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(category.level)}`}>
                            {getLevelDisplay(category.level)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {category.is_active ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <span className="mr-1">📊</span>
                            {getCategoryTypeDisplay(category.category_type)}
                          </span>
                          {category.min_height_cm && category.max_height_cm && (
                            <span className="flex items-center">
                              <span className="mr-1">📏</span>
                              {category.min_height_cm}cm - {category.max_height_cm}cm
                            </span>
                          )}
                          <span className="flex items-center">
                            <span className="mr-1">💰</span>
                            €{category.entry_fee.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {category.max_participants || '∞'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Máx. participantes
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200">
                          ✏️ Editar
                        </button>
                        <button className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          category.is_active
                            ? 'bg-red-100 hover:bg-red-200 text-red-700'
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}>
                          {category.is_active ? '🔴 Desactivar' : '🟢 Activar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>

        {/* Action Buttons Profesionales */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-3">Gestión de Categorías</h3>
            <p className="text-purple-100 text-sm mb-4">Crear y administrar categorías FEI oficiales</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Nueva Categoría</span>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-bold mb-3">Importación y Exportación</h3>
            <p className="text-green-100 text-sm mb-4">Gestionar datos de categorías en lote</p>
            <div className="flex flex-wrap gap-3">
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2">
                <span>📤</span>
                <span>Exportar Categorías</span>
              </button>
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2">
                <span>📥</span>
                <span>Importar FEI</span>
              </button>
            </div>
          </div>
        </div>

          {/* Modal de Crear Categoría */}
          <CreateCategoryModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateCategory}
          />
        </div>
      </main>
    </div>
  );
};

export default CategoriesPage;