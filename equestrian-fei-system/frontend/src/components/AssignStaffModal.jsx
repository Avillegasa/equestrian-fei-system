import { useState, useEffect } from 'react';

const AssignStaffModal = ({ isOpen, onClose, onSubmit }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [staffRole, setStaffRole] = useState('judge');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Lista de usuarios disponibles (simulada - en producción vendría del backend)
  const [availableUsers] = useState([
    { id: 1, first_name: 'Ana', last_name: 'García', email: 'ana.garcia@fei.com', role: 'judge', certification: 'FEI Level 3' },
    { id: 2, first_name: 'Carlos', last_name: 'Martínez', email: 'carlos.martinez@fei.com', role: 'judge', certification: 'FEI Level 2' },
    { id: 3, first_name: 'María', last_name: 'López', email: 'maria.lopez@fei.com', role: 'veterinarian', certification: 'Veterinaria FEI' },
    { id: 4, first_name: 'Juan', last_name: 'Rodríguez', email: 'juan.rodriguez@fei.com', role: 'judge', certification: 'FEI Level 4' },
    { id: 5, first_name: 'Laura', last_name: 'Sánchez', email: 'laura.sanchez@fei.com', role: 'staff', certification: 'Cronometradora Oficial' },
  ]);

  // Resetear selección al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      setSelectedUser(null);
      setStaffRole('judge');
      setNotes('');
      setSearchTerm('');
      setFilterRole('all');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      alert('Por favor selecciona un usuario');
      return;
    }

    onSubmit({
      first_name: selectedUser.first_name,
      last_name: selectedUser.last_name,
      email: selectedUser.email,
      user_role: selectedUser.role,
      staff_role: staffRole,
      notes: notes,
      user_id: selectedUser.id
    });

    onClose();
  };

  if (!isOpen) return null;

  // Filtrar usuarios
  const filteredUsers = availableUsers.filter(user => {
    const matchesSearch = user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const staffRoles = [
    { value: 'chief_judge', label: 'Juez Principal' },
    { value: 'judge', label: 'Juez' },
    { value: 'technical_delegate', label: 'Delegado Técnico' },
    { value: 'steward', label: 'Comisario' },
    { value: 'veterinarian', label: 'Veterinario' },
    { value: 'course_designer', label: 'Diseñador de Pista' },
    { value: 'announcer', label: 'Locutor' },
    { value: 'timekeeper', label: 'Cronometrador' },
    { value: 'scorer', label: 'Anotador' }
  ];

  const getRoleIcon = (role) => {
    const icons = {
      judge: '⚖️',
      veterinarian: '🩺',
      staff: '👤',
      organizer: '📋'
    };
    return icons[role] || '👤';
  };

  const getRoleLabel = (role) => {
    const labels = {
      judge: 'Juez',
      veterinarian: 'Veterinario',
      staff: 'Personal',
      organizer: 'Organizador'
    };
    return labels[role] || role;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-11/12 max-w-4xl shadow-2xl rounded-xl bg-white">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                👥 Asignar Personal a la Competencia
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Selecciona un usuario de la lista y asígnalo a esta competencia
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
            {/* Búsqueda y Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Buscar Usuario
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
                  📋 Filtrar por Rol
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los roles</option>
                  <option value="judge">Jueces</option>
                  <option value="veterinarian">Veterinarios</option>
                  <option value="staff">Personal</option>
                </select>
              </div>
            </div>

            {/* Lista de Usuarios */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Usuarios Disponibles ({filteredUsers.length})
              </label>
              <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron usuarios
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`p-4 border-b hover:bg-blue-50 cursor-pointer transition-colors duration-200 ${
                        selectedUser?.id === user.id ? 'bg-blue-100 border-l-4 border-l-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">{getRoleIcon(user.role)}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {user.first_name} {user.last_name}
                            </h4>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              <span className="bg-gray-100 px-2 py-1 rounded">{getRoleLabel(user.role)}</span>
                              {user.certification && (
                                <span className="ml-2 text-blue-600">• {user.certification}</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {selectedUser?.id === user.id && (
                          <div className="text-blue-600 text-xl">✓</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Rol en la competencia */}
            {selectedUser && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rol en la Competencia *
                    </label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {staffRoles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas (Opcional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Comentarios adicionales..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

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
                disabled={!selectedUser}
                className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-200 ${
                  selectedUser
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Asignar Personal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignStaffModal;