import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class AuthService {
  constructor() {
    this.interceptorsSetup = false;
    this.setupInterceptors();
  }

  /**
   * Configurar interceptores de axios para manejo automático de tokens
   */
  setupInterceptors() {
    // Evitar configurar interceptores múltiples veces
    if (this.interceptorsSetup) return;
    this.interceptorsSetup = true;
    // Request interceptor para agregar token
    axios.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        const isAuthRequest = config.url?.includes('/auth/login') || 
                             config.url?.includes('/auth/register') || 
                             config.url?.includes('/users/auth/register');
        
        // Solo agregar token si no es un request de auth y existe token
        if (token && !isAuthRequest) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor para manejar token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Evitar interceptar requests de login, register, refresh para prevenir loops
        const isAuthRequest = originalRequest.url?.includes('/auth/login') || 
                             originalRequest.url?.includes('/auth/register') || 
                             originalRequest.url?.includes('/auth/refresh') ||
                             originalRequest.url?.includes('/users/auth/register');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            const token = this.getAccessToken();
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Solo limpiar datos locales, no hacer logout request para evitar loop
            this.clearTokens();
            this.clearUser();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Login de usuario
   */
  async login(credentials) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login/`, credentials);
      const { data } = response.data;
      const { user, access, refresh } = data;
      const tokens = { access, refresh };
      
      // Guardar tokens y usuario
      this.saveTokens(tokens);
      this.saveUser(user);
      
      return { user, success: true };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(
        error.response?.data?.error || 
        error.response?.data?.detail || 
        error.response?.data?.message ||
        'Error al iniciar sesión'
      );
    }
  }

  /**
   * Registro de usuario
   */
  async register(userData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/auth/register/`, userData);
      const { user, tokens } = response.data;
      
      // Guardar tokens y usuario
      this.saveTokens(tokens);
      this.saveUser(user);
      
      return { user, success: true };
    } catch (error) {
      console.error('Register error:', error);
      const errorMessage = error.response?.data;
      
      // Formatear errores de validación
      if (typeof errorMessage === 'object' && errorMessage !== null) {
        const errorMessages = Object.entries(errorMessage)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        throw new Error(errorMessages);
      }
      
      throw new Error(errorMessage?.message || 'Error al registrar usuario');
    }
  }

  /**
   * Logout de usuario
   */
  async logout() {
    try {
      // Notificar al servidor del logout
      await axios.post(`${API_BASE_URL}/auth/logout/`);
    } catch (error) {
      console.warn('Error en logout:', error);
    } finally {
      // Limpiar datos locales
      this.clearTokens();
      this.clearUser();
    }
  }

  /**
   * Refresh del access token
   */
  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
        refresh: refreshToken
      });
      
      const { access, refresh } = response.data;
      this.saveTokens({ access, refresh });
      
      return access;
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Obtener perfil del usuario actual
   */
  async getProfile() {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/auth/profile/`);
      const user = response.data;
      this.saveUser(user);
      return user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(userData) {
    try {
      const response = await axios.patch(`${API_BASE_URL}/users/auth/profile/`, userData);
      const { user } = response.data;
      this.saveUser(user);
      return user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(passwordData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/auth/change-password/`, passwordData);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  // === TOKEN MANAGEMENT ===

  /**
   * Guardar tokens en localStorage
   */
  saveTokens(tokens) {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  /**
   * Obtener access token
   */
  getAccessToken() {
    return localStorage.getItem('access_token');
  }

  /**
   * Obtener refresh token
   */
  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  /**
   * Limpiar tokens
   */
  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Limpiar completamente todos los datos de autenticación
   */
  clearAllAuthData() {
    this.clearTokens();
    this.clearUser();
    // Limpiar cualquier otro dato relacionado con auth
    localStorage.removeItem('auth-store');
  }

  /**
   * Verificar si hay tokens válidos
   */
  hasValidTokens() {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    return !!(accessToken && refreshToken);
  }

  // === USER DATA MANAGEMENT ===

  /**
   * Guardar datos de usuario
   */
  saveUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Obtener datos de usuario
   */
  getUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Limpiar datos de usuario
   */
  clearUser() {
    localStorage.removeItem('user');
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated() {
    return this.hasValidTokens() && this.getUser() !== null;
  }

  /**
   * Verificar rol del usuario
   */
  hasRole(role) {
    const user = this.getUser();
    return user?.role === role;
  }

  /**
   * Verificar si es admin
   */
  isAdmin() {
    return this.hasRole('admin');
  }

  /**
   * Verificar si es organizador
   */
  isOrganizer() {
    return this.hasRole('organizer');
  }

  /**
   * Verificar si es juez
   */
  isJudge() {
    return this.hasRole('judge');
  }

  /**
   * Verificar permisos específicos
   */
  hasPermission(permission) {
    const user = this.getUser();
    if (!user) return false;

    // Admin tiene todos los permisos
    if (user.role === 'admin') return true;

    // Mapeo de permisos por rol
    const rolePermissions = {
      organizer: ['create_competition', 'manage_registrations'],
      judge: ['judge_competition', 'view_results'],
      viewer: ['view_results']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
  }
}

// Crear instancia singleton
const authService = new AuthService();

export default authService;