import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import authService from '../services/authService';

const useAuthStore = create(
  devtools((set, get) => ({
    // Estado inicial
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    // === ACCIONES DE AUTENTICACIÓN ===

    /**
     * Inicializar store - verificar si hay sesión activa
     */
    initializeAuth: async () => {
      const currentState = get();
      
      // Evitar múltiples inicializaciones simultáneas
      if (currentState.isLoading) return;
      
      set({ isLoading: true, error: null });
      
      try {
        if (authService.isAuthenticated()) {
          const localUser = authService.getUser();
          
          // Solo usar datos locales si están disponibles para evitar requests innecesarios
          if (localUser) {
            set({ 
              user: localUser, 
              isAuthenticated: true, 
              isLoading: false 
            });
            
            // Opcional: verificar perfil en background sin bloquear UI
            try {
              const freshUser = await authService.getProfile();
              set({ user: freshUser });
            } catch (error) {
              // Si falla la verificación, mantener datos locales
              console.warn('Could not refresh user profile:', error);
            }
          } else {
            // No hay datos locales válidos
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } else {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false, 
          error: error.message 
        });
      }
    },

    /**
     * Login de usuario
     */
    login: async (credentials) => {
      set({ isLoading: true, error: null });
      
      try {
        const { user } = await authService.login(credentials);
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
        return { success: true };
      } catch (error) {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }
    },

    /**
     * Registro de usuario
     */
    register: async (userData) => {
      set({ isLoading: true, error: null });
      
      try {
        const { user } = await authService.register(userData);
        set({ 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
        return { success: true };
      } catch (error) {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }
    },

    /**
     * Logout de usuario
     */
    logout: async () => {
      set({ isLoading: true });
      
      try {
        await authService.logout();
      } catch (error) {
        console.warn('Error during logout:', error);
      } finally {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false, 
          error: null 
        });
      }
    },

    /**
     * Actualizar perfil de usuario
     */
    updateProfile: async (userData) => {
      set({ isLoading: true, error: null });
      
      try {
        const updatedUser = await authService.updateProfile(userData);
        set({ 
          user: updatedUser, 
          isLoading: false 
        });
        return { success: true };
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }
    },

    /**
     * Cambiar contraseña
     */
    changePassword: async (passwordData) => {
      set({ isLoading: true, error: null });
      
      try {
        await authService.changePassword(passwordData);
        set({ isLoading: false });
        return { success: true };
      } catch (error) {
        set({ 
          isLoading: false, 
          error: error.message 
        });
        return { success: false, error: error.message };
      }
    },

    // === UTILIDADES ===

    /**
     * Limpiar errores
     */
    clearError: () => set({ error: null }),

    /**
     * Verificar permisos
     */
    hasRole: (role) => {
      const { user } = get();
      return user?.role === role;
    },

    /**
     * Verificar si es admin
     */
    isAdmin: () => {
      const { user } = get();
      return user?.role === 'admin';
    },

    /**
     * Verificar si es organizador
     */
    isOrganizer: () => {
      const { user } = get();
      return user?.role === 'organizer';
    },

    /**
     * Verificar si es juez
     */
    isJudge: () => {
      const { user } = get();
      return user?.role === 'judge';
    },

    /**
     * Verificar si es rider
     */
    isRider: () => {
      const { user } = get();
      return user?.role === 'rider';
    },

    /**
     * Verificar permisos específicos
     */
    hasPermission: (permission) => {
      return authService.hasPermission(permission);
    },

    /**
     * Obtener nombre completo del usuario
     */
    getFullName: () => {
      const { user } = get();
      if (!user) return '';
      return user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
    },

    /**
     * Obtener rol formateado
     */
    getRoleDisplay: () => {
      const { user } = get();
      if (!user) return '';
      
      const roleMap = {
        admin: 'Administrador',
        organizer: 'Organizador',
        judge: 'Juez',
        rider: 'Jinete',
        viewer: 'Espectador'
      };

      return roleMap[user.role] || user.role;
    }
  }), {
    name: 'auth-store' // nombre para devtools
  })
);

export default useAuthStore;