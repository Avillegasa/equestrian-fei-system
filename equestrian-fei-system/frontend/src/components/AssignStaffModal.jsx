import { useState, useEffect } from 'react';
import userService from '../services/userService';

const AssignStaffModal = ({ isOpen, onClose, onSubmit }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [staffRole, setStaffRole] = useState('judge'); // Por defecto: Juez
  const [judgePosition, setJudgePosition] = useState('C'); // Posición del juez (C, B, H, E, M)
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Cargar jueces desde API usando userService.getJudges()
  useEffect(() => {
    const loadJudges = async () => {
      setLoadingUsers(true);
      try {
        console.log('⚖️ Cargando jueces desde API...');

        // Cargar solo jueces del sistema
        const judges = await userService.getJudges();

        setAvailableUsers(judges);
        console.log('✅ Jueces cargados desde API:', judges.length);
      } catch (error) {
        console.error('❌ Error al cargar jueces:', error);
        setAvailableUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (isOpen) {
      loadJudges();
    }
  }, [isOpen]);

  // Resetear selección al abrir/cerrar
  useEffect(() => {
    if (!isOpen) {
      setSelectedUser(null);
      setStaffRole('judge');
      setJudgePosition('C');
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

    // Solo enviar campos requeridos por el backend
    onSubmit({
      staff_member: selectedUser.id,  // Backend espera staff_member, no user_id
      role: staffRole,                // Backend espera role, no staff_role
      notes: notes || ''              // Notes opcional
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
    { value: 'organizer', label: 'Organizador' },
    { value: 'chief_judge', label: 'Juez Principal' },
    { value: 'judge', label: 'Juez' },
    { value: 'observer', label: 'Observador' }
  ];

  const getRoleIcon = (role) => {
    const icons = {
      admin: '👑',
      judge: '⚖️',
      veterinarian: '🩺',
      staff: '👤',
      organizer: '📋'
    };
    return icons[role] || '👤';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador',
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
                Selecciona usuarios del sistema y asígnales un rol en esta competencia
              </p>
              <div className="mt-2 flex gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                  📋 Organizador
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                  👨‍⚖️ Juez Principal
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                  ⚖️ Juez
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                  👁️ Observador
                </span>
              </div>
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
                  <option value="all">Todos los roles ({availableUsers.length})</option>
                  <option value="judge">Jueces ({availableUsers.filter(u => u.role === 'judge').length})</option>
                  <option value="admin">Administradores ({availableUsers.filter(u => u.role === 'admin').length})</option>
                  <option value="organizer">Organizadores ({availableUsers.filter(u => u.role === 'organizer').length})</option>
                  <option value="veterinarian">Veterinarios ({availableUsers.filter(u => u.role === 'veterinarian').length})</option>
                  <option value="staff">Personal ({availableUsers.filter(u => u.role === 'staff').length})</option>
                </select>
              </div>
            </div>

            {/* Lista de Usuarios */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Usuarios Disponibles ({filteredUsers.length})
              </label>
              <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg">
                {loadingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Cargando usuarios...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
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
              <div className="bg-blue-50 border border-blue-200 p-5 rounded-lg">
                <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                  <span className="mr-2">🎭</span>
                  Asignación de Rol en la Competencia
                </h4>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 gap-3">
                    {/* Información del usuario seleccionado */}
                    <div className="flex items-center justify-between pb-3 border-b">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedUser.first_name} {selectedUser.last_name}
                        </p>
                        <p className="text-xs text-gray-600">{selectedUser.email}</p>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getRoleLabel(selectedUser.role)}
                      </span>
                    </div>

                    {/* Selector de rol */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rol en esta Competencia *
                      </label>
                      <select
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {staffRoles.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>

                      {/* Descripción del rol seleccionado */}
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-700">
                          {staffRole === 'organizer' && '📋 Gestiona la competencia, tiene acceso a casi todas las funciones'}
                          {staffRole === 'chief_judge' && '👨‍⚖️ Juez principal responsable de supervisar la calificación'}
                          {staffRole === 'judge' && '⚖️ Califica a los participantes durante la competencia'}
                          {staffRole === 'observer' && '👁️ Puede ver la competencia y rankings en vivo'}
                        </p>
                      </div>
                    </div>

                    {/* Selector de Posición del Juez (solo para jueces) */}
                    {(staffRole === 'judge' || staffRole === 'chief_judge') && (
                      <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-purple-900 mb-2">
                          🎯 Posición del Juez *
                        </label>
                        <select
                          value={judgePosition}
                          onChange={(e) => setJudgePosition(e.target.value)}
                          className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium"
                        >
                          <option value="C">C - Posición Central (Principal)</option>
                          <option value="B">B - Posición Lateral Izquierda</option>
                          <option value="H">H - Posición Lateral Derecha</option>
                          <option value="E">E - Posición Final</option>
                          <option value="M">M - Posición Media</option>
                        </select>
                        <div className="mt-2 p-2 bg-white rounded text-xs text-gray-700">
                          <p className="font-medium text-purple-800 mb-1">Información de Posiciones FEI:</p>
                          <ul className="space-y-1">
                            <li><span className="font-semibold">C:</span> Posición central - Juez principal (vista frontal)</li>
                            <li><span className="font-semibold">B:</span> Posición lateral - Vista desde la izquierda</li>
                            <li><span className="font-semibold">H:</span> Posición lateral - Vista desde la derecha</li>
                            <li><span className="font-semibold">E:</span> Posición final - Vista posterior</li>
                            <li><span className="font-semibold">M:</span> Posición media - Vista lateral central</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Notas opcionales */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notas Adicionales (Opcional)
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej: Responsable del área de saltos"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
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