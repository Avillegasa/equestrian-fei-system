import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCompetitionStore from '../store/competitionStore';
import CreateTemplateModal from '../components/CreateTemplateModal';
import TemplateCard from '../components/TemplateCard';

const TemplatesManagementPage = () => {
  const { user, logout } = useAuth();
  const {
    templates,
    templatesLoading,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate
  } = useCompetitionStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [filterDiscipline, setFilterDiscipline] = useState('all');
  const [filterType, setFilterType] = useState('all'); // 'all', 'system', 'custom'

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const handleCreateTemplate = async (templateData) => {
    const result = await createTemplate(templateData);
    if (result.success) {
      setShowCreateModal(false);
      alert('✅ Plantilla creada exitosamente!');
    } else {
      alert('❌ Error al crear plantilla: ' + (result.error?.message || 'Error desconocido'));
    }
  };

  const handleUpdateTemplate = async (templateData) => {
    const result = await updateTemplate(editingTemplate.id, templateData);
    if (result.success) {
      setEditingTemplate(null);
      setShowCreateModal(false);
      alert('✅ Plantilla actualizada exitosamente!');
    } else {
      alert('❌ Error al actualizar plantilla: ' + (result.error?.message || result.error || 'Error desconocido'));
    }
  };

  const handleEditTemplate = (template) => {
    if (template.is_system) {
      alert('⚠️ No se pueden editar plantillas del sistema FEI');
      return;
    }
    setEditingTemplate(template);
    setShowCreateModal(true);
  };

  const handleDeleteTemplate = async (templateId) => {
    const result = await deleteTemplate(templateId);
    if (result.success) {
      alert('✅ Plantilla eliminada exitosamente');
    } else {
      alert('❌ Error al eliminar plantilla: ' + (result.error || 'Error desconocido'));
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingTemplate(null);
  };

  // Filtrar plantillas
  const filteredTemplates = templates.filter(template => {
    const disciplineMatch = filterDiscipline === 'all' || template.discipline === filterDiscipline;
    const typeMatch = filterType === 'all' ||
      (filterType === 'system' && template.is_system) ||
      (filterType === 'custom' && !template.is_system);
    return disciplineMatch && typeMatch;
  });

  // Separar plantillas del sistema y personalizadas
  const systemTemplates = filteredTemplates.filter(t => t.is_system);
  const customTemplates = filteredTemplates.filter(t => !t.is_system);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/organizer"
                className="text-purple-600 hover:text-purple-500 transition-colors font-medium"
              >
                ← Volver al Dashboard
              </Link>
              <div className="h-8 w-px bg-gray-300"></div>
              <h1 className="text-3xl font-bold text-gray-900">
                📋 Gestión de Plantillas de Calificación
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Hola, {user?.first_name || 'Usuario'}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Sistema de Plantillas FEI
              </h2>
              <p className="text-gray-600 text-sm">
                Gestiona plantillas de calificación para tus competencias ecuestres.
                Utiliza plantillas estándar FEI o crea plantillas personalizadas según tus necesidades.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setShowCreateModal(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl font-medium whitespace-nowrap"
            >
              ✨ Crear Nueva Plantilla
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Plantillas</p>
                <p className="text-3xl font-bold text-gray-900">{templates.length}</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Plantillas Sistema</p>
                <p className="text-3xl font-bold text-gray-900">{systemTemplates.length}</p>
              </div>
              <div className="text-4xl">🔒</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mis Plantillas</p>
                <p className="text-3xl font-bold text-gray-900">{customTemplates.length}</p>
              </div>
              <div className="text-4xl">✨</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disciplinas</p>
                <p className="text-3xl font-bold text-gray-900">
                  {new Set(templates.map(t => t.discipline)).size}
                </p>
              </div>
              <div className="text-4xl">🏇</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Disciplina
              </label>
              <select
                value={filterDiscipline}
                onChange={(e) => setFilterDiscipline(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todas las disciplinas</option>
                <option value="dressage">🎭 Dressage</option>
                <option value="jumping">🏇 Salto</option>
                <option value="eventing">🏆 Concurso Completo</option>
                <option value="endurance">⏱️ Endurance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Tipo
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todas las plantillas</option>
                <option value="system">🔒 Solo del Sistema</option>
                <option value="custom">✨ Solo Personalizadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {templatesLoading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Cargando plantillas...</p>
          </div>
        )}

        {/* Empty State */}
        {!templatesLoading && filteredTemplates.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No hay plantillas disponibles
            </h3>
            <p className="text-gray-600 mb-6">
              {filterDiscipline !== 'all' || filterType !== 'all'
                ? 'No se encontraron plantillas con los filtros seleccionados'
                : 'Crea tu primera plantilla de calificación para comenzar'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              ✨ Crear Primera Plantilla
            </button>
          </div>
        )}

        {/* Templates Lists */}
        {!templatesLoading && filteredTemplates.length > 0 && (
          <>
            {/* Plantillas del Sistema */}
            {systemTemplates.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    🔒 Plantillas FEI Estándar
                  </h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {systemTemplates.length}
                  </span>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  Plantillas oficiales del sistema FEI, listas para usar en tus competencias.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {systemTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      readOnly={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Plantillas Personalizadas */}
            {customTemplates.length > 0 && (
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    ✨ Mis Plantillas Personalizadas
                  </h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {customTemplates.length}
                  </span>
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  Plantillas creadas por ti para necesidades específicas de tus competencias.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onEdit={handleEditTemplate}
                      onDelete={handleDeleteTemplate}
                      readOnly={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            💡 ¿Cómo funcionan las plantillas?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🔒 Plantillas del Sistema:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Plantillas oficiales FEI predefinidas</li>
                <li>• No pueden ser editadas ni eliminadas</li>
                <li>• Listas para usar en cualquier competencia</li>
                <li>• Cumplen con estándares internacionales</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">✨ Plantillas Personalizadas:</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• Creadas por ti según tus necesidades</li>
                <li>• Totalmente editables y configurables</li>
                <li>• Define ejercicios y notas de conjunto</li>
                <li>• Asigna a competencias específicas</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
        initialData={editingTemplate}
        isEditMode={!!editingTemplate}
      />
    </div>
  );
};

export default TemplatesManagementPage;
