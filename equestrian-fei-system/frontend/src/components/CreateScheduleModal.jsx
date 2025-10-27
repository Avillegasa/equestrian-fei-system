import { useState, useEffect } from 'react';

const CreateScheduleModal = ({ isOpen, onClose, onSubmit, initialData = null, isEditMode = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    schedule_type: 'category_start',
    start_time: '',
    end_time: '',
    discipline: 'Show Jumping',
    category: '',
    location: 'Arena Principal'
  });

  // Cargar datos iniciales cuando se está editando
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        schedule_type: initialData.schedule_type || 'category_start',
        start_time: initialData.start_time || '',
        end_time: initialData.end_time || '',
        discipline: initialData.discipline || 'Show Jumping',
        category: initialData.category || '',
        location: initialData.location || 'Arena Principal'
      });
    } else if (!isEditMode) {
      // Reset form cuando se cierra el modal de edición
      setFormData({
        title: '',
        description: '',
        schedule_type: 'category_start',
        start_time: '',
        end_time: '',
        discipline: 'Show Jumping',
        category: '',
        location: 'Arena Principal'
      });
    }
  }, [isEditMode, initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    // Reset form
    setFormData({
      title: '',
      description: '',
      schedule_type: 'category_start',
      start_time: '',
      end_time: '',
      discipline: 'Show Jumping',
      category: '',
      location: 'Arena Principal'
    });
    onClose();
  };

  if (!isOpen) return null;

  const scheduleTypes = [
    { value: 'competition_start', label: 'Inicio de Competencia' },
    { value: 'discipline_start', label: 'Inicio de Disciplina' },
    { value: 'category_start', label: 'Inicio de Categoría' },
    { value: 'break', label: 'Descanso' },
    { value: 'lunch', label: 'Almuerzo' },
    { value: 'awards', label: 'Premiación' },
    { value: 'special_event', label: 'Evento Especial' }
  ];

  const disciplines = [
    'Show Jumping',
    'Dressage',
    'Eventing',
    'Endurance',
    'Vaulting',
    'Driving'
  ];

  const categories = [
    'Juvenil 1.20m',
    'Senior 1.40m',
    'Principiantes',
    'Intermedio 1.30m',
    'Avanzado 1.50m',
    'Gran Premio 1.60m'
  ];

  const locations = [
    'Arena Principal',
    'Arena Secundaria',
    'Pista de Calentamiento',
    'Área de Reconocimiento',
    'Área de Restauración',
    'Sala de Reuniones',
    'Establos'
  ];

  const needsCategoryAndDiscipline = ['category_start', 'discipline_start'].includes(formData.schedule_type);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between pb-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditMode ? '✏️ Editar Evento' : '📅 Programar Nuevo Evento'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Información básica */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Título del Evento *
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="Prueba Juvenil 1.20m - Ronda Clasificatoria"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="Descripción detallada del evento..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Tipo de evento */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Evento *
              </label>
              <select
                name="schedule_type"
                required
                value={formData.schedule_type}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {scheduleTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Horarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Hora de Inicio *
                </label>
                <input
                  type="datetime-local"
                  name="start_time"
                  required
                  value={formData.start_time}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Hora de Fin *
                </label>
                <input
                  type="datetime-local"
                  name="end_time"
                  required
                  value={formData.end_time}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Disciplina y Categoría (condicional) */}
            {needsCategoryAndDiscipline && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Disciplina *
                  </label>
                  <select
                    name="discipline"
                    required
                    value={formData.discipline}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {disciplines.map(discipline => (
                      <option key={discipline} value={discipline}>
                        {discipline}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.schedule_type === 'category_start' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Categoría *
                    </label>
                    <select
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Ubicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ubicación *
              </label>
              <select
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {locations.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Ejemplos rápidos */}
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-blue-600">💡</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    Ejemplos de eventos típicos
                  </h4>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Reconocimiento:</strong> 30 min antes de cada categoría</li>
                      <li><strong>Pruebas:</strong> 3-4 horas por categoría según participantes</li>
                      <li><strong>Descansos:</strong> 15-30 min entre pruebas</li>
                      <li><strong>Premiaciones:</strong> 30 min al final de cada día</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción rápida */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-800 mb-2">
                Plantillas rápidas:
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    title: 'Reconocimiento de Pistas',
                    schedule_type: 'special_event',
                    description: 'Reconocimiento oficial del recorrido'
                  })}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                >
                  Reconocimiento
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    title: 'Descanso',
                    schedule_type: 'break',
                    description: 'Pausa entre pruebas'
                  })}
                  className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
                >
                  Descanso
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    title: 'Ceremonia de Premiación',
                    schedule_type: 'awards',
                    description: 'Entrega de premios y trofeos'
                  })}
                  className="px-3 py-1 text-xs bg-gold-100 text-gold-800 rounded-md hover:bg-gold-200"
                >
                  Premiación
                </button>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {isEditMode ? 'Guardar Cambios' : 'Programar Evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateScheduleModal;