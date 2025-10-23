import { useState, useEffect } from 'react';

const CreateCompetitionModal = ({ isOpen, onClose, onSubmit, initialData = null, isEditMode = false }) => {
  // Función para obtener fecha en formato datetime-local (hora local)
  const getDefaultDateTime = (daysFromNow = 0, hours = 10) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(hours, 0, 0, 0);

    // Convertir a formato datetime-local (YYYY-MM-DDTHH:mm)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  // Función para convertir fecha ISO a datetime-local (hora local, no UTC)
  const formatDateForInput = (isoDate) => {
    if (!isoDate) return '';

    const date = new Date(isoDate);

    // Convertir a formato datetime-local usando hora local
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  // Función para obtener la fecha actual en formato datetime-local
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  const getInitialFormData = () => {
    if (isEditMode && initialData) {
      return {
        name: initialData.name || '',
        short_name: initialData.shortName || initialData.short_name || '',
        description: initialData.description || '',
        competition_type: initialData.competitionType || initialData.competition_type || 'international',
        start_date: formatDateForInput(initialData.startDate || initialData.start_date),
        end_date: formatDateForInput(initialData.endDate || initialData.end_date),
        registration_start: formatDateForInput(initialData.registrationStart || initialData.registration_start),
        registration_end: formatDateForInput(initialData.registrationEnd || initialData.registration_end),
        discipline: initialData.discipline || 'jumping',
        venue_name: initialData.venueName || initialData.venue_name || '',
        venue_city: initialData.venueCity || initialData.venue_city || '',
        venue_country: initialData.venueCountry || initialData.venue_country || '',
        max_participants: initialData.maxParticipants || initialData.max_participants || '',
        entry_fee: initialData.entryFee || initialData.entry_fee || '0'
      };
    }
    return {
      name: '',
      short_name: '',
      description: '',
      competition_type: 'international',
      start_date: getDefaultDateTime(30),
      end_date: getDefaultDateTime(33),
      registration_start: getDefaultDateTime(1),
      registration_end: getDefaultDateTime(25),
      discipline: 'jumping',
      venue_name: '',
      venue_city: '',
      venue_country: '',
      max_participants: '',
      entry_fee: '0'
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  // Actualizar formData cuando cambie initialData
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData());
    }
  }, [isOpen, initialData, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };

      // Auto-ajustar fechas relacionadas para mantener lógica
      if (name === 'start_date' && value) {
        const startDate = new Date(value);
        const endDate = new Date(prev.end_date);

        // Si la fecha de fin es anterior a la nueva fecha de inicio, ajustarla
        if (endDate <= startDate) {
          const newEndDate = new Date(startDate);
          newEndDate.setDate(newEndDate.getDate() + 3); // 3 días después por defecto
          newData.end_date = newEndDate.toISOString().slice(0, 16);
        }
      }

      if (name === 'registration_start' && value) {
        const regStart = new Date(value);
        const regEnd = new Date(prev.registration_end);

        // Si la fecha de fin de inscripción es anterior al nuevo inicio, ajustarla
        if (regEnd <= regStart) {
          const newRegEnd = new Date(regStart);
          newRegEnd.setDate(newRegEnd.getDate() + 20); // 20 días después por defecto
          newData.registration_end = newRegEnd.toISOString().slice(0, 16);
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Esperar a que se complete la creación antes de cerrar
    await onSubmit(formData);
    // Reset form después de envío exitoso
    setFormData({
      name: '',
      short_name: '',
      description: '',
      competition_type: 'international',
      start_date: getDefaultDateTime(30),
      end_date: getDefaultDateTime(33),
      registration_start: getDefaultDateTime(1),
      registration_end: getDefaultDateTime(25),
      discipline: 'jumping',
      venue_name: '',
      venue_city: '',
      venue_country: '',
      max_participants: '',
      entry_fee: '0'
    });
    // No cerramos aquí, lo hace el parent después del éxito
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between pb-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              {isEditMode ? '✏️ Editar Competencia' : '🏆 Crear Nueva Competencia'}
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
                  Nombre de la Competencia *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Copa Internacional de Salto 2024"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre Corto *
                </label>
                <input
                  type="text"
                  name="short_name"
                  required
                  value={formData.short_name}
                  onChange={handleChange}
                  placeholder="CIS2024"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Descripción de la competencia..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Tipo y disciplina */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Competencia *
                </label>
                <select
                  name="competition_type"
                  required
                  value={formData.competition_type}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="national">Nacional</option>
                  <option value="international">Internacional</option>
                  <option value="regional">Regional</option>
                  <option value="local">Local</option>
                  <option value="championship">Campeonato</option>
                  <option value="friendly">Amistoso</option>
                </select>
              </div>

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
                  <option value="jumping">Salto</option>
                  <option value="dressage">Dressage</option>
                  <option value="eventing">Concurso Completo</option>
                  <option value="endurance">Resistencia</option>
                  <option value="vaulting">Volteo</option>
                  <option value="driving">Enganche</option>
                </select>
              </div>
            </div>

            {/* Fechas de inscripción */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Inicio Inscripción * <span className="text-gray-500 font-normal">(desde cuándo pueden inscribirse)</span>
                </label>
                <input
                  type="datetime-local"
                  name="registration_start"
                  required
                  value={formData.registration_start}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fin Inscripción * <span className="text-gray-500 font-normal">(hasta cuándo pueden inscribirse)</span>
                </label>
                <input
                  type="datetime-local"
                  name="registration_end"
                  required
                  value={formData.registration_end}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Fechas de la competencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Inicio * <span className="text-gray-500 font-normal">(cuando comienza la competencia)</span>
                </label>
                <input
                  type="datetime-local"
                  name="start_date"
                  required
                  value={formData.start_date}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Fin * <span className="text-gray-500 font-normal">(cuando termina la competencia)</span>
                </label>
                <input
                  type="datetime-local"
                  name="end_date"
                  required
                  value={formData.end_date}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Sede */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre de la Sede *
                </label>
                <input
                  type="text"
                  name="venue_name"
                  required
                  value={formData.venue_name}
                  onChange={handleChange}
                  placeholder="Club Hípico Madrid"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ciudad *
                </label>
                <input
                  type="text"
                  name="venue_city"
                  required
                  value={formData.venue_city}
                  onChange={handleChange}
                  placeholder="Madrid"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  País *
                </label>
                <input
                  type="text"
                  name="venue_country"
                  required
                  value={formData.venue_country}
                  onChange={handleChange}
                  placeholder="España"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

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
                  placeholder="0.00"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
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
                {isEditMode ? 'Guardar Cambios' : 'Crear Competencia'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCompetitionModal;