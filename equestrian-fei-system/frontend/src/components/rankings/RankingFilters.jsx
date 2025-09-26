import { useState, useEffect } from 'react';
import useCompetitionStore from '../../store/competitionStore';

const RankingFilters = ({ filters, onFilterChange, competitionId }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const { categories, loadCategories } = useCompetitionStore();

  useEffect(() => {
    if (competitionId) {
      loadCategories(competitionId);
    }
  }, [competitionId]);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...localFilters,
      [key]: value
    };

    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      competitionId,
      categoryId: null,
      status: 'active',
      isPublic: true,
    };

    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Limpiar filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            value={localFilters.categoryId || ''}
            onChange={(e) => handleFilterChange('categoryId', e.target.value || null)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={localFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="paused">Pausado</option>
            <option value="completed">Completado</option>
            <option value="archived">Archivado</option>
          </select>
        </div>

        {/* Public Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Visibilidad
          </label>
          <select
            value={localFilters.isPublic ? 'true' : 'false'}
            onChange={(e) => handleFilterChange('isPublic', e.target.value === 'true')}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="true">Públicos</option>
            <option value="false">Privados</option>
            <option value="">Todos</option>
          </select>
        </div>

        {/* Quick Actions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Acciones rápidas
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => handleFilterChange('status', 'active')}
              className="flex-1 bg-green-100 text-green-800 px-3 py-2 rounded text-xs font-medium hover:bg-green-200"
            >
              Solo activos
            </button>
            <button
              onClick={() => {
                handleFilterChange('status', 'active');
                handleFilterChange('isPublic', true);
              }}
              className="flex-1 bg-blue-100 text-blue-800 px-3 py-2 rounded text-xs font-medium hover:bg-blue-200"
            >
              Públicos activos
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(localFilters.categoryId || localFilters.status !== 'active' || !localFilters.isPublic) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Filtros activos:</span>
            <div className="flex flex-wrap gap-2">
              {localFilters.categoryId && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {categories.find(c => c.id === localFilters.categoryId)?.name}
                  <button
                    onClick={() => handleFilterChange('categoryId', null)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}

              {localFilters.status !== 'active' && localFilters.status && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {localFilters.status}
                  <button
                    onClick={() => handleFilterChange('status', 'active')}
                    className="ml-1 text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </span>
              )}

              {!localFilters.isPublic && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Privados
                  <button
                    onClick={() => handleFilterChange('isPublic', true)}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingFilters;