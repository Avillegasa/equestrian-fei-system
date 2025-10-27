import { useState, useEffect } from 'react';

const RegisterParticipantModal = ({ isOpen, onClose, onSubmit, acceptedCategories = [] }) => {
  const [registrationMode, setRegistrationMode] = useState('select'); // 'select' o 'manual'
  const [selectedUsers, setSelectedUsers] = useState([]); // Array de usuarios seleccionados
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNationality, setFilterNationality] = useState('all');

  const [formData, setFormData] = useState({
    rider_first_name: '',
    rider_last_name: '',
    rider_email: '',
    rider_nationality: 'ESP',
    rider_category: ''
  });

  // Categorías FEI disponibles
  const availableCategories = [
    'Pony',
    'Junior (14-18 años)',
    'Young Rider (18-21 años)',
    'Amateur',
    'Professional',
    'Senior',
    'Veterans (45+ años)',
    'CSI1* (1.30m-1.35m)',
    'CSI2* (1.35m-1.40m)',
    'CSI3* (1.40m-1.45m)',
    'CSI4* (1.45m-1.50m)',
    'CSI5* (1.50m-1.60m)'
  ];

  // Lista de jinetes disponibles - Cargar dinámicamente desde localStorage
  const [availableRiders, setAvailableRiders] = useState([]);

  // Cargar jinetes desde localStorage
  useEffect(() => {
    const loadRiders = () => {
      let riders = JSON.parse(localStorage.getItem('fei_riders') || '[]');

      // Si no hay jinetes, inicializar con datos de ejemplo
      if (riders.length === 0) {
        riders = [
          {
            id: 1,
            first_name: 'María',
            last_name: 'González',
            email: 'maria.gonzalez@feisystem.com',
            nationality: 'ESP',
            fei_license: 'FEI-ESP-12345',
            category: 'Professional'
          },
          {
            id: 2,
            first_name: 'Jean',
            last_name: 'Dubois',
            email: 'jean.dubois@feisystem.com',
            nationality: 'FRA',
            fei_license: 'FEI-FRA-67890',
            category: 'CSI3* (1.40m-1.45m)'
          },
          {
            id: 3,
            first_name: 'Hans',
            last_name: 'Müller',
            email: 'hans.muller@feisystem.com',
            nationality: 'GER',
            fei_license: 'FEI-GER-11223',
            category: 'Senior'
          },
          {
            id: 4,
            first_name: 'Marco',
            last_name: 'Rossi',
            email: 'marco.rossi@feisystem.com',
            nationality: 'ITA',
            fei_license: 'FEI-ITA-44556',
            category: 'Junior (14-18 años)'
          },
          {
            id: 5,
            first_name: 'João',
            last_name: 'Silva',
            email: 'joao.silva@feisystem.com',
            nationality: 'POR',
            fei_license: 'FEI-POR-78901',
            category: 'Amateur'
          },
          {
            id: 6,
            first_name: 'Emily',
            last_name: 'Smith',
            email: 'emily.smith@feisystem.com',
            nationality: 'GBR',
            fei_license: 'FEI-GBR-23456',
            category: 'Young Rider (18-21 años)'
          },
        ];

        // Guardar en localStorage
        localStorage.setItem('fei_riders', JSON.stringify(riders));
      }

      setAvailableRiders(riders);
      console.log('🏇 Jinetes cargados:', riders.length);
    };

    if (isOpen) {
      loadRiders();
    }
  }, [isOpen]);

  // Resetear selección al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      setRegistrationMode('select');
      setSelectedUsers([]);
      setSearchTerm('');
      setFilterNationality('all');
      setFormData({
        rider_first_name: '',
        rider_last_name: '',
        rider_email: '',
        rider_nationality: 'ESP',
        rider_category: ''
      });
    }
  }, [isOpen]);

  // Manejar selección/deselección de jinetes
  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Seleccionar/deseleccionar todos
  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredRiders.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers([...filteredRiders]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (registrationMode === 'select') {
      // Modo selección múltiple
      if (selectedUsers.length === 0) {
        alert('⚠️ Por favor selecciona al menos un jinete');
        return;
      }

      // Validar categorías de todos los jinetes seleccionados
      const invalidRiders = selectedUsers.filter(user =>
        acceptedCategories.length > 0 && !acceptedCategories.includes(user.category)
      );

      if (invalidRiders.length > 0) {
        const names = invalidRiders.map(r => `${r.first_name} ${r.last_name}`).join(', ');
        alert(`⚠️ Los siguientes jinetes tienen categorías no aceptadas: ${names}`);
        return;
      }

      // Procesar cada jinete seleccionado
      for (const user of selectedUsers) {
        const participantData = {
          rider_id: user.id,
          rider_first_name: user.first_name,
          rider_last_name: user.last_name,
          rider_email: user.email,
          rider_nationality: user.nationality,
          rider_category: user.category,
          fei_license: user.fei_license
        };

        await onSubmit(participantData);
      }

      alert(`✅ ${selectedUsers.length} jinete(s) registrado(s) exitosamente!`);
      onClose();

    } else if (registrationMode === 'manual') {
      // Modo manual (un solo jinete)
      if (acceptedCategories.length > 0 && !acceptedCategories.includes(formData.rider_category)) {
        alert(`⚠️ La categoría "${formData.rider_category}" no está aceptada en esta competencia`);
        return;
      }

      await onSubmit(formData);
      alert('✅ Jinete registrado exitosamente!');
      onClose();
    } else {
      alert('⚠️ Por favor selecciona al menos un jinete o completa el registro manual');
    }
  };

  if (!isOpen) return null;

  const categories = [
    'Juvenil 1.20m',
    'Senior 1.40m',
    'Principiantes',
    'Intermedio 1.30m',
    'Avanzado 1.50m',
    'Gran Premio 1.60m'
  ];

  const nationalities = [
    'ESP', 'FRA', 'GER', 'ITA', 'POR', 'GBR', 'USA', 'ARG', 'BRA', 'MEX'
  ];

  // Filtrar jinetes por búsqueda, nacionalidad y categoría aceptada
  const filteredRiders = availableRiders.filter(rider => {
    const matchesSearch = rider.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rider.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rider.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNationality = filterNationality === 'all' || rider.nationality === filterNationality;

    // Si hay categorías aceptadas, filtrar solo jinetes con esas categorías
    const matchesCategory = acceptedCategories.length === 0 || acceptedCategories.includes(rider.category);

    return matchesSearch && matchesNationality && matchesCategory;
  });

  const getNationalityFlag = (nationality) => {
    const flags = {
      'ESP': '🇪🇸', 'FRA': '🇫🇷', 'GER': '🇩🇪', 'ITA': '🇮🇹',
      'POR': '🇵🇹', 'GBR': '🇬🇧', 'USA': '🇺🇸', 'ARG': '🇦🇷',
      'BRA': '🇧🇷', 'MEX': '🇲🇽'
    };
    return flags[nationality] || '🏳️';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-11/12 max-w-4xl shadow-2xl rounded-xl bg-white">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                🏇 Registrar Participante en la Competencia
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Selecciona un jinete existente o regístralo manualmente
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Selector de Modo */}
            <div className="flex items-center justify-center space-x-4 bg-gray-100 p-4 rounded-lg">
              <button
                type="button"
                onClick={() => setRegistrationMode('select')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  registrationMode === 'select'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                👥 Seleccionar Jinete Existente
              </button>
              <button
                type="button"
                onClick={() => setRegistrationMode('manual')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  registrationMode === 'manual'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                ✏️ Registro Manual
              </button>
            </div>

            {/* Modo: Seleccionar Jinete Existente */}
            {registrationMode === 'select' && (
              <>
                {/* Búsqueda y Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🔍 Buscar Jinete
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nombre, apellido o email..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🌍 Filtrar por Nacionalidad
                    </label>
                    <select
                      value={filterNationality}
                      onChange={(e) => setFilterNationality(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todas las nacionalidades</option>
                      {nationalities.map(nat => (
                        <option key={nat} value={nat}>{getNationalityFlag(nat)} {nat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Lista de Jinetes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Jinetes Disponibles ({filteredRiders.length})
                    </label>
                    {filteredRiders.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {selectedUsers.length === filteredRiders.length ? '❌ Deseleccionar todos' : '✓ Seleccionar todos'}
                      </button>
                    )}
                  </div>
                  {selectedUsers.length > 0 && (
                    <div className="mb-2 px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded-lg">
                      ✓ {selectedUsers.length} jinete(s) seleccionado(s)
                    </div>
                  )}
                  <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
                    {filteredRiders.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <div className="text-gray-400 text-4xl mb-3">🔍</div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          No se encontraron jinetes elegibles
                        </p>
                        <p className="text-xs text-gray-500">
                          {acceptedCategories.length > 0
                            ? `Solo jinetes con categorías: ${acceptedCategories.join(', ')}`
                            : 'Intenta ajustar los filtros de búsqueda'}
                        </p>
                      </div>
                    ) : (
                      filteredRiders.map(rider => {
                        const isSelected = selectedUsers.some(u => u.id === rider.id);
                        return (
                          <div
                            key={rider.id}
                            onClick={() => toggleUserSelection(rider)}
                            className={`p-4 border-b hover:bg-blue-50 cursor-pointer transition-colors duration-200 ${
                              isSelected ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleUserSelection(rider)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                  <span className="text-xl">🏇</span>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {rider.first_name} {rider.last_name}
                                  </h4>
                                  <p className="text-sm text-gray-600">{rider.email}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    <span className="bg-gray-100 px-2 py-1 rounded">
                                      {getNationalityFlag(rider.nationality)} {rider.nationality}
                                    </span>
                                    <span className="ml-2 text-blue-600">• {rider.fei_license}</span>
                                  </p>
                                  {rider.category && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                        🏆 {rider.category}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="text-blue-600 text-xl font-bold">✓</div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Modo: Registro Manual */}
            {registrationMode === 'manual' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-blue-900 mb-4">👤 Información del Jinete</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="rider_first_name"
                      required
                      value={formData.rider_first_name}
                      onChange={handleChange}
                      placeholder="María"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      name="rider_last_name"
                      required
                      value={formData.rider_last_name}
                      onChange={handleChange}
                      placeholder="González"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nacionalidad *
                    </label>
                    <select
                      name="rider_nationality"
                      required
                      value={formData.rider_nationality}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {nationalities.map(nat => (
                        <option key={nat} value={nat}>{getNationalityFlag(nat)} {nat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="rider_email"
                      required
                      value={formData.rider_email}
                      onChange={handleChange}
                      placeholder="maria.gonzalez@example.com"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Categoría del Jinete *
                    </label>
                    <select
                      name="rider_category"
                      required
                      value={formData.rider_category}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar categoría...</option>
                      {(acceptedCategories.length > 0 ? acceptedCategories : availableCategories).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}


            {/* Información FEI */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-900">
                    Requisitos FEI para Participación
                  </h4>
                  <div className="mt-2 text-sm text-blue-800">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Licencia FEI vigente del jinete (se valida con su perfil)</li>
                      <li>Información de contacto de emergencia actualizada en el perfil</li>
                      <li>Datos del caballo registrados en el sistema</li>
                      <li>Seguro de responsabilidad civil obligatorio</li>
                    </ul>
                  </div>
                  <p className="mt-3 text-xs text-blue-700 italic">
                    💡 Nota: La información del caballo y contacto de emergencia debe estar previamente registrada en el perfil del jinete.
                  </p>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={registrationMode === 'select' && selectedUsers.length === 0}
                className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-200 ${
                  (registrationMode === 'select' && selectedUsers.length > 0) || registrationMode === 'manual'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {registrationMode === 'select' && selectedUsers.length > 0
                  ? `Registrar ${selectedUsers.length} Participante${selectedUsers.length > 1 ? 's' : ''}`
                  : 'Registrar Participante'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterParticipantModal;