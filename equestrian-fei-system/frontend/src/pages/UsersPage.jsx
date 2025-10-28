import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import userService from '../services/userService';
import CreateUserModal from '../components/CreateUserModal';
import EditUserModal from '../components/EditUserModal';
import * as XLSX from 'xlsx';

const UsersPage = () => {
  const { user: currentUser, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const handleLogout = async () => {
    await logout();
  };

  // Cargar usuarios
  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;

      const usersData = await userService.getUsers(params);
      setUsers(usersData);
      console.log('✅ Usuarios cargados:', usersData.length);
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error);
      alert('Error al cargar usuarios. Verifica la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, roleFilter]);

  // Handler para crear usuario
  const handleCreateUser = () => {
    setShowCreateModal(true);
  };

  // Handler cuando se crea un usuario exitosamente
  const handleUserCreated = async (newUser) => {
    alert('✅ Usuario creado exitosamente!');
    await loadUsers(); // Recargar lista
  };

  // Handler para editar usuario
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handler cuando se actualiza un usuario exitosamente
  const handleUserUpdated = async (updatedUser) => {
    alert('✅ Usuario actualizado exitosamente!');
    await loadUsers(); // Recargar lista
  };

  // Handler para abrir modal de confirmación de eliminación
  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Handler para confirmar eliminación
  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await userService.deleteUser(userToDelete.id);
      alert('✅ Usuario eliminado exitosamente');
      setShowDeleteModal(false);
      setUserToDelete(null);
      await loadUsers(); // Recargar lista
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      alert('❌ Error al eliminar usuario: ' + error.message);
    }
  };

  // Handler para verificar usuario
  const handleVerifyUser = async (userId) => {
    try {
      await userService.verifyUser(userId);
      alert('✅ Usuario verificado exitosamente');
      await loadUsers(); // Recargar lista
    } catch (error) {
      console.error('❌ Error al verificar usuario:', error);
      alert('❌ Error al verificar usuario: ' + error.message);
    }
  };

  // Handler para cambiar estado activo/inactivo
  const handleToggleStatus = async (user) => {
    try {
      if (user.is_active) {
        await userService.deactivateUser(user.id);
        alert('✅ Usuario desactivado exitosamente');
      } else {
        await userService.activateUser(user.id);
        alert('✅ Usuario activado exitosamente');
      }
      await loadUsers(); // Esperar a que recargue la lista
    } catch (error) {
      console.error('❌ Error al cambiar estado del usuario:', error);
      alert('❌ Error al cambiar estado: ' + error.message);
    }
  };

  // Handler para exportar lista de usuarios a Excel
  const handleExportUsers = () => {
    try {
      // Preparar datos para exportación
      const exportData = users.map(user => ({
        'Nombre de Usuario': user.username,
        'Email': user.email,
        'Nombre': user.first_name,
        'Apellido': user.last_name,
        'Rol': getRoleDisplay(user.role),
        'Teléfono': user.phone || '',
        'Estado': user.is_active ? 'Activo' : 'Inactivo',
        'Verificado': user.is_verified ? 'Sí' : 'No',
        'Fecha de Creación': user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : ''
      }));

      // Crear worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 15 }, // Nombre de Usuario
        { wch: 30 }, // Email
        { wch: 15 }, // Nombre
        { wch: 15 }, // Apellido
        { wch: 15 }, // Rol
        { wch: 15 }, // Teléfono
        { wch: 10 }, // Estado
        { wch: 10 }, // Verificado
        { wch: 15 }  // Fecha de Creación
      ];
      ws['!cols'] = colWidths;

      // Crear workbook y agregar worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

      // Generar nombre de archivo con fecha
      const fileName = `usuarios_fei_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Guardar archivo
      XLSX.writeFile(wb, fileName);

      alert(`✅ Lista exportada exitosamente!\n\nArchivo: ${fileName}`);
    } catch (error) {
      console.error('❌ Error al exportar usuarios:', error);
      alert('❌ Error al exportar lista. Verifica la consola para más detalles.');
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      organizer: 'bg-blue-100 text-blue-800',
      judge: 'bg-green-100 text-green-800',
      rider: 'bg-orange-100 text-orange-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleDisplay = (role) => {
    const roles = {
      admin: 'Administrador',
      organizer: 'Organizador',
      judge: 'Juez',
      rider: 'Jinete',
      viewer: 'Espectador'
    };
    return roles[role] || role;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.first_name + ' ' + user.last_name).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === '' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Profesional */}
      <header className="bg-white shadow-lg border-b-4 border-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors duration-200 bg-purple-50 px-3 py-2 rounded-lg"
              >
                <span>←</span>
                <span className="font-medium">Dashboard</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">👥</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                  <p className="text-sm text-gray-600">Sistema FEI - Control de Acceso</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {currentUser?.first_name} {currentUser?.last_name}
                </p>
                <p className="text-xs text-gray-600">Administrador</p>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-3xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Jueces</p>
                <p className="text-3xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'judge').length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">⚖️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Organizadores</p>
                <p className="text-3xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'organizer').length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Jinetes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'rider').length}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <span className="text-2xl">🏇</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-gray-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Espectadores</p>
                <p className="text-3xl font-bold text-gray-900">
                  {users.filter(u => u.role === 'viewer').length}
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded-full">
                <span className="text-2xl">👁️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 flex-1">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre, usuario o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Todos los roles</option>
                  <option value="admin">Administradores</option>
                  <option value="organizer">Organizadores</option>
                  <option value="judge">Jueces</option>
                  <option value="rider">Jinetes</option>
                  <option value="viewer">Espectadores</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleExportUsers}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <span>📊</span>
                <span>Exportar Lista</span>
              </button>
              <button
                onClick={handleCreateUser}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <span>+</span>
                <span>Crear Usuario</span>
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow-xl overflow-hidden sm:rounded-xl">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <h3 className="text-lg leading-6 font-bold text-gray-900">
              Lista de Usuarios ({filteredUsers.length})
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Gestiona todos los usuarios del sistema FEI con roles y permisos
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-sm text-gray-500">Cargando usuarios...</p>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <span className="text-6xl">👤</span>
              <p className="mt-4 text-lg font-medium text-gray-900">No hay usuarios</p>
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm || roleFilter ? 'No se encontraron usuarios con esos filtros' : 'Comienza creando tu primer usuario'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <li key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center shadow-lg">
                            <span className="text-lg font-bold text-white">
                              {user.first_name?.charAt(0) || user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {user.first_name} {user.last_name}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                              {getRoleDisplay(user.role)}
                            </span>
                            {!user.is_active && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Inactivo
                              </span>
                            )}
                            {!user.is_verified && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Sin verificar
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-sm text-gray-600 truncate">
                              @{user.username}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {user.email}
                            </p>
                            {user.phone && (
                              <p className="text-sm text-gray-500">
                                {user.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!user.is_verified && (
                          <button
                            onClick={() => handleVerifyUser(user.id)}
                            className="text-green-600 hover:text-green-700 text-sm font-medium px-3 py-1 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
                            title="Verificar usuario"
                          >
                            ✓ Verificar
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`text-sm font-medium px-3 py-1 rounded-lg transition-colors duration-200 ${
                            user.is_active
                              ? 'text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100'
                              : 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100'
                          }`}
                          title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {user.is_active ? '⏸ Desactivar' : '▶ Activar'}
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition-colors duration-200"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Modales */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={handleUserCreated}
      />

      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onUserUpdated={handleUserUpdated}
        user={selectedUser}
      />

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                ¿Eliminar Usuario?
              </h3>
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-4">
                  Estás a punto de eliminar el usuario:
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-bold text-gray-900">{userToDelete.first_name} {userToDelete.last_name}</p>
                  <p className="text-sm text-gray-600">@{userToDelete.username}</p>
                  <p className="text-sm text-gray-600">{userToDelete.email}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Rol: {getRoleDisplay(userToDelete.role)}
                  </p>
                </div>
                <p className="text-red-600 text-sm font-medium mt-4">
                  Esta acción no se puede deshacer
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
