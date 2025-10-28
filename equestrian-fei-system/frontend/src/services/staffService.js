import axios from 'axios';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class StaffService {
  constructor() {
    this.useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true' || false;
  }

  /**
   * Configurar headers de autenticación
   */
  getAuthHeaders() {
    const token = authService.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Obtener personal de una competencia específica
   */
  async getCompetitionStaff(competitionId) {
    try {
      // Intentar API primero
      const response = await axios.get(
        `${API_BASE_URL}/competitions/staff/?competition=${competitionId}`,
        { headers: this.getAuthHeaders() }
      );
      console.log('✅ Personal cargado desde API:', response.data);
      // DRF retorna {results: []} con paginación, extraer el array
      return response.data.results || response.data;
    } catch (error) {
      console.error('❌ Error al obtener personal desde API:', error);

      // Fallback a localStorage si la API falla
      if (this.useLocalStorage || !navigator.onLine) {
        console.log('⚠️ Usando localStorage como fallback');
        const storageKey = `fei_staff_${competitionId}`;
        const savedStaff = localStorage.getItem(storageKey);
        return savedStaff ? JSON.parse(savedStaff) : [];
      }

      throw error;
    }
  }

  /**
   * Asignar personal a una competencia
   */
  async assignStaff(competitionId, staffData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/competitions/staff/`,
        {
          competition: competitionId,
          staff_member: staffData.staff_member,
          role: staffData.role,
          notes: staffData.notes || ''
        },
        { headers: this.getAuthHeaders() }
      );
      console.log('✅ Personal asignado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al asignar personal:', error);

      // Fallback a localStorage
      if (this.useLocalStorage || !navigator.onLine) {
        const storageKey = `fei_staff_${competitionId}`;
        const savedStaff = JSON.parse(localStorage.getItem(storageKey) || '[]');

        const newStaff = {
          id: Date.now().toString(),
          competition: competitionId,
          staff_member: staffData.staff_member,
          role: staffData.role,
          notes: staffData.notes || '',
          is_confirmed: false,
          assigned_date: new Date().toISOString()
        };

        savedStaff.push(newStaff);
        localStorage.setItem(storageKey, JSON.stringify(savedStaff));
        return newStaff;
      }

      throw error;
    }
  }

  /**
   * Eliminar asignación de personal
   */
  async removeStaff(staffId, competitionId) {
    try {
      await axios.delete(
        `${API_BASE_URL}/competitions/staff/${staffId}/`,
        { headers: this.getAuthHeaders() }
      );
      console.log('✅ Personal eliminado exitosamente');
      return { success: true };
    } catch (error) {
      console.error('❌ Error al eliminar personal:', error);

      // Fallback a localStorage
      if (this.useLocalStorage || !navigator.onLine) {
        const storageKey = `fei_staff_${competitionId}`;
        const savedStaff = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedStaff = savedStaff.filter(s => s.id !== staffId);
        localStorage.setItem(storageKey, JSON.stringify(updatedStaff));
        return { success: true };
      }

      throw error;
    }
  }

  /**
   * Confirmar asignación de juez a una competencia
   */
  async confirmJudgeAssignment(competitionId, judgeId) {
    try {
      // En desarrollo, usar localStorage
      if (this.useLocalStorage || !navigator.onLine) {
        const storageKey = `fei_staff_${competitionId}`;
        const savedStaff = localStorage.getItem(storageKey);

        if (!savedStaff) {
          throw new Error('No se encontró personal para esta competencia');
        }

        const staff = JSON.parse(savedStaff);

        // Buscar al juez por ID de usuario
        const staffIndex = staff.findIndex(s =>
          (s.staff_member?.id === judgeId || s.staff_member?.id === parseInt(judgeId)) &&
          (s.role === 'judge' || s.role === 'chief_judge')
        );

        if (staffIndex === -1) {
          throw new Error('Juez no encontrado en esta competencia');
        }

        // Actualizar is_confirmed
        staff[staffIndex].is_confirmed = true;
        staff[staffIndex].confirmed_at = new Date().toISOString();

        // Guardar en localStorage
        localStorage.setItem(storageKey, JSON.stringify(staff));

        console.log('✅ Asignación de juez confirmada:', staff[staffIndex]);
        return staff[staffIndex];
      }

      // En producción, llamar al backend
      const response = await axios.post(
        `${API_BASE_URL}/competitions/${competitionId}/staff/confirm/`,
        { judge_id: judgeId }
      );
      return response.data;
    } catch (error) {
      console.error('Error al confirmar asignación:', error);
      throw error;
    }
  }

  /**
   * Rechazar asignación de juez a una competencia
   */
  async rejectJudgeAssignment(competitionId, judgeId, reason = '') {
    try {
      // En desarrollo, usar localStorage
      if (this.useLocalStorage || !navigator.onLine) {
        const storageKey = `fei_staff_${competitionId}`;
        const savedStaff = localStorage.getItem(storageKey);

        if (!savedStaff) {
          throw new Error('No se encontró personal para esta competencia');
        }

        const staff = JSON.parse(savedStaff);

        // Eliminar al juez de la lista
        const updatedStaff = staff.filter(s =>
          !(s.staff_member?.id === judgeId || s.staff_member?.id === parseInt(judgeId))
        );

        // Guardar en localStorage
        localStorage.setItem(storageKey, JSON.stringify(updatedStaff));

        console.log('❌ Asignación de juez rechazada');
        return { success: true, reason };
      }

      // En producción, llamar al backend
      const response = await axios.post(
        `${API_BASE_URL}/competitions/${competitionId}/staff/reject/`,
        { judge_id: judgeId, reason }
      );
      return response.data;
    } catch (error) {
      console.error('Error al rechazar asignación:', error);
      throw error;
    }
  }

  /**
   * Obtener competencias asignadas a un juez específico
   */
  async getJudgeAssignments(judgeId) {
    try {
      // En desarrollo, buscar en todas las competencias
      if (this.useLocalStorage || !navigator.onLine) {
        const assignments = [];

        // Obtener todas las competencias
        const competitions = JSON.parse(localStorage.getItem('fei_competitions') || '[]');

        // Para cada competencia, buscar si el juez está asignado
        for (const competition of competitions) {
          const storageKey = `fei_staff_${competition.id}`;
          const savedStaff = localStorage.getItem(storageKey);

          if (savedStaff) {
            const staff = JSON.parse(savedStaff);
            const judgeAssignment = staff.find(s =>
              (s.staff_member?.id === judgeId || s.staff_member?.id === parseInt(judgeId)) &&
              (s.role === 'judge' || s.role === 'chief_judge')
            );

            if (judgeAssignment) {
              assignments.push({
                competition,
                assignment: judgeAssignment
              });
            }
          }
        }

        return assignments;
      }

      // En producción, llamar al backend
      const response = await axios.get(`${API_BASE_URL}/judges/${judgeId}/assignments/`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener asignaciones del juez:', error);
      return [];
    }
  }
}

const staffService = new StaffService();
export default staffService;
