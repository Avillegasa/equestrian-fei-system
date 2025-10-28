import axios from 'axios';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class UserService {
  constructor() {
    // Solo usar localStorage como fallback offline, controlado por variable de entorno
    this.useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true' || false;
  }

  // ============================================================================
  // ELIMINADO: initLocalStorage() con ~70 líneas de usuarios hardcodeados
  //
  // Anteriormente este archivo tenía 5 usuarios hardcodeados (admin, judge1,
  // organizer1, rider1, viewer1) que se cargaban automáticamente en localStorage.
  //
  // AHORA: El sistema usa SIEMPRE la API del backend como fuente principal.
  // Los usuarios se crean en el backend vía scripts de seed o endpoints de registro.
  // localStorage solo se usa como fallback offline real.
  // ============================================================================

  /**
   * Obtener solo jueces activos (para asignar a competencias)
   */
  async getJudges() {
    try {
      const token = authService.getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      console.log('🌐 Cargando jueces desde API...');
      const response = await axios.get(`${API_BASE_URL}/users/judges/`, { headers });
      console.log('✅ Jueces cargados desde API:', response.data);

      // DRF puede retornar {results: []} con paginación
      return response.data.results || response.data;
    } catch (error) {
      console.error('❌ Error al cargar jueces desde backend:', error);

      // Fallback a localStorage SOLO si está explícitamente configurado
      if (this.useLocalStorage) {
        const storageKey = 'fei_users';
        const users = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const judges = users.filter(u => u.role === 'judge' && u.is_active !== false);
        console.log('⚠️ Usando localStorage como fallback offline para jueces:', judges.length);
        return judges;
      }

      throw error;
    }
  }

  /**
   * Obtener todos los usuarios
   */
  async getUsers(params = {}) {
    try {
      console.log('🌐 Cargando usuarios desde API...');
      const token = authService.getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_BASE_URL}/users/users/`, {
        params,
        headers
      });

      console.log('✅ Usuarios cargados desde API:', response.data);
      return response.data.results || response.data;
    } catch (error) {
      console.error('❌ Error al cargar usuarios desde backend:', error);

      // Fallback a localStorage SOLO si está explícitamente configurado
      if (this.useLocalStorage) {
        const storageKey = 'fei_users';
        const users = JSON.parse(localStorage.getItem(storageKey) || '[]');

        // Aplicar filtros si existen
        let filteredUsers = users;

        if (params.role) {
          filteredUsers = filteredUsers.filter(u => u.role === params.role);
        }

        if (params.is_active !== undefined) {
          filteredUsers = filteredUsers.filter(u => u.is_active === params.is_active);
        }

        if (params.search) {
          const search = params.search.toLowerCase();
          filteredUsers = filteredUsers.filter(u =>
            u.username.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search) ||
            u.first_name.toLowerCase().includes(search) ||
            u.last_name.toLowerCase().includes(search)
          );
        }

        console.log('⚠️ Usando localStorage como fallback offline:', filteredUsers.length);
        return filteredUsers;
      }

      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId) {
    try {
      console.log(`🌐 Cargando usuario ${userId} desde API...`);
      const token = authService.getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_BASE_URL}/users/users/${userId}/`, { headers });
      console.log('✅ Usuario cargado desde API:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener usuario desde backend:', error);

      // Fallback a localStorage SOLO si está explícitamente configurado
      if (this.useLocalStorage) {
        const storageKey = 'fei_users';
        const users = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const user = users.find(u => u.id === userId);

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        console.log('⚠️ Usando localStorage como fallback offline');
        return user;
      }

      throw error;
    }
  }

  /**
   * Crear nuevo usuario
   */
  async createUser(userData) {
    try {
      console.log('🌐 Creando usuario en API...');
      const token = authService.getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.post(`${API_BASE_URL}/users/users/`, userData, { headers });
      console.log('✅ Usuario creado en API:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear usuario en backend:', error);

      // Fallback a localStorage SOLO si está explícitamente configurado
      if (this.useLocalStorage) {
        const storageKey = 'fei_users';
        const users = JSON.parse(localStorage.getItem(storageKey) || '[]');

        // Validar campos requeridos
        if (!userData.username || !userData.email || !userData.password) {
          throw new Error('Campos requeridos: username, email, password');
        }

        // Verificar si el username o email ya existen
        const existingUser = users.find(u =>
          u.username === userData.username || u.email === userData.email
        );

        if (existingUser) {
          throw new Error('El username o email ya están en uso');
        }

        // Crear nuevo usuario
        const newUser = {
          id: String(Date.now()),
          username: userData.username,
          email: userData.email,
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          role: userData.role || 'viewer',
          is_active: true,
          is_verified: false,
          phone: userData.phone || '',
          created_at: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem(storageKey, JSON.stringify(users));

        console.log('⚠️ Usuario creado en localStorage como fallback offline:', newUser);
        return newUser;
      }

      throw error;
    }
  }

  /**
   * Actualizar usuario existente
   */
  async updateUser(userId, userData) {
    try {
      console.log(`🌐 Actualizando usuario ${userId} en API...`);
      const token = authService.getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.patch(`${API_BASE_URL}/users/users/${userId}/`, userData, { headers });
      console.log('✅ Usuario actualizado en API:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar usuario en backend:', error);

      // Fallback a localStorage SOLO si está explícitamente configurado
      if (this.useLocalStorage) {
        const storageKey = 'fei_users';
        const users = JSON.parse(localStorage.getItem(storageKey) || '[]');

        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
          throw new Error('Usuario no encontrado');
        }

        // Actualizar usuario
        users[userIndex] = {
          ...users[userIndex],
          ...userData,
          id: userId, // Mantener el ID original
          updated_at: new Date().toISOString()
        };

        localStorage.setItem(storageKey, JSON.stringify(users));

        console.log('⚠️ Usuario actualizado en localStorage como fallback offline:', users[userIndex]);
        return users[userIndex];
      }

      throw error;
    }
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(userId) {
    try {
      console.log(`🌐 Eliminando usuario ${userId} en API...`);
      const token = authService.getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.delete(`${API_BASE_URL}/users/users/${userId}/`, { headers });
      console.log('✅ Usuario eliminado en API');
      return { success: true };
    } catch (error) {
      console.error('❌ Error al eliminar usuario en backend:', error);

      // Fallback a localStorage SOLO si está explícitamente configurado
      if (this.useLocalStorage) {
        const storageKey = 'fei_users';
        const users = JSON.parse(localStorage.getItem(storageKey) || '[]');

        const updatedUsers = users.filter(u => u.id !== userId);

        if (users.length === updatedUsers.length) {
          throw new Error('Usuario no encontrado');
        }

        localStorage.setItem(storageKey, JSON.stringify(updatedUsers));

        console.log('⚠️ Usuario eliminado de localStorage como fallback offline');
        return { success: true };
      }

      throw error;
    }
  }

  /**
   * Verificar usuario
   */
  async verifyUser(userId) {
    try {
      console.log(`🌐 Verificando usuario ${userId} en API...`);
      const token = authService.getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.post(`${API_BASE_URL}/users/users/${userId}/verify_user/`, {}, { headers });
      console.log('✅ Usuario verificado en API');
      return response.data;
    } catch (error) {
      console.error('❌ Error al verificar usuario en backend:', error);

      // Fallback a localStorage SOLO si está explícitamente configurado
      if (this.useLocalStorage) {
        console.log('⚠️ Usando localStorage como fallback offline');
        return await this.updateUser(userId, { is_verified: true });
      }

      throw error;
    }
  }

  /**
   * Desactivar usuario
   */
  async deactivateUser(userId) {
    try {
      console.log(`🌐 Desactivando usuario ${userId} en API...`);
      const token = authService.getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.post(`${API_BASE_URL}/users/users/${userId}/deactivate_user/`, {}, { headers });
      console.log('✅ Usuario desactivado en API');
      return response.data;
    } catch (error) {
      console.error('❌ Error al desactivar usuario en backend:', error);

      // Fallback a localStorage SOLO si está explícitamente configurado
      if (this.useLocalStorage) {
        console.log('⚠️ Usando localStorage como fallback offline');
        return await this.updateUser(userId, { is_active: false });
      }

      throw error;
    }
  }

  /**
   * Activar usuario
   */
  async activateUser(userId) {
    try {
      console.log(`🌐 Activando usuario ${userId}...`);
      return await this.updateUser(userId, { is_active: true });
    } catch (error) {
      console.error('❌ Error al activar usuario:', error);
      throw error;
    }
  }

  /**
   * Validar datos de usuario
   */
  validateUserData(userData, isUpdate = false) {
    const errors = {};

    if (!isUpdate) {
      if (!userData.username || userData.username.length < 3) {
        errors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
      }

      if (!userData.password || userData.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (userData.password !== userData.password_confirm) {
        errors.password_confirm = 'Las contraseñas no coinciden';
      }
    }

    if (!userData.email || !/\S+@\S+\.\S+/.test(userData.email)) {
      errors.email = 'Email inválido';
    }

    if (!userData.first_name) {
      errors.first_name = 'El nombre es requerido';
    }

    if (!userData.last_name) {
      errors.last_name = 'El apellido es requerido';
    }

    if (!userData.role) {
      errors.role = 'El rol es requerido';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Singleton instance
const userService = new UserService();
export default userService;
