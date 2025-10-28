import axios from 'axios';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class UserService {
  constructor() {
    // Detectar si estamos en desarrollo para usar localStorage
    this.useMockData = import.meta.env.MODE === 'development' ||
                       window.location.hostname === 'localhost';

    // Inicializar datos de ejemplo en localStorage si no existen
    if (this.useMockData) {
      this.initLocalStorage();
    }
  }

  /**
   * Inicializar localStorage con datos de ejemplo
   */
  initLocalStorage() {
    const storageKey = 'fei_users';
    const existingUsers = localStorage.getItem(storageKey);

    if (!existingUsers) {
      const defaultUsers = [
        {
          id: '1',
          username: 'admin',
          email: 'admin@test.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'admin',
          is_active: true,
          is_verified: true,
          phone: '+34 123 456 789',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          username: 'judge1',
          email: 'judge1@fei.com',
          first_name: 'María',
          last_name: 'González',
          role: 'judge',
          is_active: true,
          is_verified: true,
          phone: '+34 987 654 321',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          username: 'organizer1',
          email: 'organizer1@fei.com',
          first_name: 'Carlos',
          last_name: 'Rodríguez',
          role: 'organizer',
          is_active: true,
          is_verified: true,
          phone: '+34 555 123 456',
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          username: 'rider1',
          email: 'rider1@example.com',
          first_name: 'Laura',
          last_name: 'Martínez',
          role: 'rider',
          is_active: true,
          is_verified: false,
          phone: '+34 666 777 888',
          created_at: new Date().toISOString()
        },
        {
          id: '5',
          username: 'viewer1',
          email: 'viewer1@example.com',
          first_name: 'Juan',
          last_name: 'Pérez',
          role: 'viewer',
          is_active: true,
          is_verified: true,
          phone: '+34 111 222 333',
          created_at: new Date().toISOString()
        }
      ];

      localStorage.setItem(storageKey, JSON.stringify(defaultUsers));
      console.log('✅ Usuarios de ejemplo inicializados en localStorage');
    }
  }

  /**
   * Obtener solo jueces activos (para asignar a competencias)
   */
  async getJudges() {
    try {
      const token = authService.getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.get(`${API_BASE_URL}/users/judges/`, { headers });
      console.log('✅ Jueces cargados desde API:', response.data);

      // DRF puede retornar {results: []} con paginación
      return response.data.results || response.data;
    } catch (error) {
      console.error('❌ Error al cargar jueces:', error);

      // Fallback a localStorage si useMockData está activado
      if (this.useMockData) {
        const storageKey = 'fei_users';
        const users = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const judges = users.filter(u => u.role === 'judge' && u.is_active !== false);
        console.log('⚠️ Usando localStorage como fallback para jueces:', judges.length);
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
      // Si estamos en desarrollo, usar localStorage
      if (this.useMockData) {
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

        console.log('✅ Usuarios cargados desde localStorage:', filteredUsers.length);
        return filteredUsers;
      }

      // Producción: usar API real
      const response = await axios.get(`${API_BASE_URL}/users/users/`, { params });
      return response.data.results || response.data;
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error);
      throw error;
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId) {
    try {
      if (this.useMockData) {
        const storageKey = 'fei_users';
        const users = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const user = users.find(u => u.id === userId);

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        return user;
      }

      const response = await axios.get(`${API_BASE_URL}/users/users/${userId}/`);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener usuario:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo usuario
   */
  async createUser(userData) {
    try {
      if (this.useMockData) {
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

        console.log('✅ Usuario creado en localStorage:', newUser);
        return newUser;
      }

      // Producción: usar API real
      const response = await axios.post(`${API_BASE_URL}/users/users/`, userData);
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
      throw error;
    }
  }

  /**
   * Actualizar usuario existente
   */
  async updateUser(userId, userData) {
    try {
      if (this.useMockData) {
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

        console.log('✅ Usuario actualizado en localStorage:', users[userIndex]);
        return users[userIndex];
      }

      // Producción: usar API real
      const response = await axios.patch(`${API_BASE_URL}/users/users/${userId}/`, userData);
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar usuario:', error);
      throw error;
    }
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(userId) {
    try {
      if (this.useMockData) {
        const storageKey = 'fei_users';
        const users = JSON.parse(localStorage.getItem(storageKey) || '[]');

        const updatedUsers = users.filter(u => u.id !== userId);

        if (users.length === updatedUsers.length) {
          throw new Error('Usuario no encontrado');
        }

        localStorage.setItem(storageKey, JSON.stringify(updatedUsers));

        console.log('✅ Usuario eliminado de localStorage');
        return { success: true };
      }

      // Producción: usar API real
      await axios.delete(`${API_BASE_URL}/users/users/${userId}/`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      throw error;
    }
  }

  /**
   * Verificar usuario
   */
  async verifyUser(userId) {
    try {
      if (this.useMockData) {
        return await this.updateUser(userId, { is_verified: true });
      }

      const response = await axios.post(`${API_BASE_URL}/users/users/${userId}/verify_user/`);
      return response.data;
    } catch (error) {
      console.error('❌ Error al verificar usuario:', error);
      throw error;
    }
  }

  /**
   * Desactivar usuario
   */
  async deactivateUser(userId) {
    try {
      if (this.useMockData) {
        return await this.updateUser(userId, { is_active: false });
      }

      const response = await axios.post(`${API_BASE_URL}/users/users/${userId}/deactivate_user/`);
      return response.data;
    } catch (error) {
      console.error('❌ Error al desactivar usuario:', error);
      throw error;
    }
  }

  /**
   * Activar usuario
   */
  async activateUser(userId) {
    try {
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
