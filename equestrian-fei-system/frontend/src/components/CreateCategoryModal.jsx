import { useState, useEffect } from 'react';

const CreateCategoryModal = ({ isOpen, onClose, onSubmit, initialData = null, isEdit = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category_type: 'height',
    level: 'intermediate',
    min_age: '',
    max_age: '',
    min_height_cm: '',
    max_height_cm: '',
    max_participants: '',
    entry_fee: '0',
    description: ''
  });

  // Cargar datos iniciales al editar
  useEffect(() => {
    if (isEdit && initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        category_type: initialData.category_type || 'height',
        level: initialData.level || 'intermediate',
        min_age: initialData.min_age || '',
        max_age: initialData.max_age || '',
        min_height_cm: initialData.min_height_cm || '',
        max_height_cm: initialData.max_height_cm || '',
        max_participants: initialData.max_participants || '',
        entry_fee: initialData.entry_fee || '0',
        description: initialData.description || ''
      });
    }
  }, [isEdit, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form solo si no estamos editando
    if (!isEdit) {
      setFormData({
        name: '',
        code: '',
        category_type: 'height',
        level: 'intermediate',
        min_age: '',
        max_age: '',
        min_height_cm: '',
        max_height_cm: '',
        max_participants: '',
        entry_fee: '0',
        description: ''
      });
    }
    // No cerramos aquí, el parent lo cierra después del éxito
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between pb-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              {isEdit ? '✏️ Editar Categoría' : '📋 Crear Nueva Categoría'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Juvenil 1.20m"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Código *
                </label>
                <input
                  type="text"
                  name="code"
                  required
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="JUV120"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Tipo y nivel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Categoría *
                </label>
                <select
                  name="category_type"
                  required
                  value={formData.category_type}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="height">Por Altura</option>
                  <option value="level">Por Nivel</option>
                  <option value="age">Por Edad</option>
                  <option value="mixed">Mixta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nivel *
                </label>
                <select
                  name="level"
                  required
                  value={formData.level}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="beginner">Principiante</option>
                  <option value="intermediate">Intermedio</option>
                  <option value="advanced">Avanzado</option>
                  <option value="professional">Profesional</option>
                  <option value="international">Internacional</option>
                </select>
              </div>
            </div>

            {/* Restricciones de edad */}
            {formData.category_type === 'age' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Edad Mínima (años)
                  </label>
                  <input
                    type="number"
                    name="min_age"
                    value={formData.min_age}
                    onChange={handleChange}
                    placeholder="12"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Edad Máxima (años)
                  </label>
                  <input
                    type="number"
                    name="max_age"
                    value={formData.max_age}
                    onChange={handleChange}
                    placeholder="18"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Restricciones de altura */}
            {formData.category_type === 'height' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Altura Mínima (cm)
                  </label>
                  <input
                    type="number"
                    name="min_height_cm"
                    value={formData.min_height_cm}
                    onChange={handleChange}
                    placeholder="115"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Altura Máxima (cm)
                  </label>
                  <input
                    type="number"
                    name="max_height_cm"
                    value={formData.max_height_cm}
                    onChange={handleChange}
                    placeholder="125"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Configuración */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Máximo Participantes
                </label>
                <input
                  type="number"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleChange}
                  placeholder="50"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tarifa de Inscripción (€)
                </label>
                <input
                  type="number"
                  name="entry_fee"
                  step="0.01"
                  value={formData.entry_fee}
                  onChange={handleChange}
                  placeholder="75.00"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Descripción adicional de la categoría..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
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
                {isEdit ? 'Actualizar Categoría' : 'Crear Categoría'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCategoryModal;