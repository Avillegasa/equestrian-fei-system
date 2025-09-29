import { useState } from 'react';

const RegisterParticipantModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    // Datos del jinete
    rider_first_name: '',
    rider_last_name: '',
    rider_email: '',
    rider_nationality: 'ESP',

    // Datos del caballo
    horse_name: '',
    horse_registration: '',
    horse_breed: '',
    horse_age: '',
    horse_height: '',
    horse_gender: 'stallion',

    // Datos de la participación
    category: '',
    special_requirements: '',

    // Contacto de emergencia
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

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
      rider_first_name: '',
      rider_last_name: '',
      rider_email: '',
      rider_nationality: 'ESP',
      horse_name: '',
      horse_registration: '',
      horse_breed: '',
      horse_age: '',
      horse_height: '',
      horse_gender: 'stallion',
      category: '',
      special_requirements: '',
      emergency_contact_name: '',
      emergency_contact_phone: ''
    });
    onClose();
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

  const breeds = [
    'Pura Sangre Español',
    'Hannoveriano',
    'KWPN',
    'Oldenburgo',
    'Silla Francesa',
    'Warmblood',
    'Árabe',
    'Lusitano',
    'Otro'
  ];

  const nationalities = [
    'ESP', 'FRA', 'GER', 'ITA', 'POR', 'GBR', 'USA', 'ARG', 'BRA', 'MEX'
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between pb-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              🏇 Registrar Nuevo Participante
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-6">

            {/* Sección del Jinete */}
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
                      <option key={nat} value={nat}>{nat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
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
            </div>

            {/* Sección del Caballo */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-green-900 mb-4">🐎 Información del Caballo</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre del Caballo *
                  </label>
                  <input
                    type="text"
                    name="horse_name"
                    required
                    value={formData.horse_name}
                    onChange={handleChange}
                    placeholder="Thunder"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número de Registro *
                  </label>
                  <input
                    type="text"
                    name="horse_registration"
                    required
                    value={formData.horse_registration}
                    onChange={handleChange}
                    placeholder="ESP001"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Raza *
                  </label>
                  <select
                    name="horse_breed"
                    required
                    value={formData.horse_breed}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar raza</option>
                    {breeds.map(breed => (
                      <option key={breed} value={breed}>{breed}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Edad (años) *
                  </label>
                  <input
                    type="number"
                    name="horse_age"
                    required
                    min="4"
                    max="25"
                    value={formData.horse_age}
                    onChange={handleChange}
                    placeholder="8"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Altura (cm) *
                  </label>
                  <input
                    type="number"
                    name="horse_height"
                    required
                    min="140"
                    max="185"
                    value={formData.horse_height}
                    onChange={handleChange}
                    placeholder="165"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Sexo *
                </label>
                <select
                  name="horse_gender"
                  required
                  value={formData.horse_gender}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="stallion">Semental</option>
                  <option value="mare">Yegua</option>
                  <option value="gelding">Caballo castrado</option>
                </select>
              </div>
            </div>

            {/* Sección de Participación */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-purple-900 mb-4">🏆 Información de Participación</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Requerimientos Especiales
                  </label>
                  <input
                    type="text"
                    name="special_requirements"
                    value={formData.special_requirements}
                    onChange={handleChange}
                    placeholder="Alergias, medicamentos, etc."
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Sección de Contacto de Emergencia */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-red-900 mb-4">🚨 Contacto de Emergencia</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    required
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="Carlos González"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    required
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    placeholder="+34 600 123 456"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Información FEI */}
            <div className="bg-yellow-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-yellow-600">⚠️</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Requisitos FEI
                  </h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>El caballo debe tener al menos 4 años de edad</li>
                      <li>Certificado veterinario vigente requerido</li>
                      <li>Seguro de responsabilidad civil obligatorio</li>
                      <li>Licencia FEI del jinete debe estar al día</li>
                    </ul>
                  </div>
                </div>
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
                Registrar Participante
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterParticipantModal;