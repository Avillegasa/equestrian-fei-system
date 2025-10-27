import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class StaffService {
  constructor() {
    this.useLocalStorage = import.meta.env.VITE_USE_LOCAL_STORAGE === 'true' || false;
  }

  /**
   * Obtener personal de una competencia específica
   */
  async getCompetitionStaff(competitionId) {
    try {
      // En desarrollo, usar localStorage
      if (this.useLocalStorage || !navigator.onLine) {
        const storageKey = `fei_staff_${competitionId}`;
        const savedStaff = localStorage.getItem(storageKey);
        return savedStaff ? JSON.parse(savedStaff) : [];
      }

      // En producción, llamar al backend
      const response = await axios.get(`${API_BASE_URL}/competitions/${competitionId}/staff/`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener personal:', error);
      // Fallback a localStorage
      const storageKey = `fei_staff_${competitionId}`;
      const savedStaff = localStorage.getItem(storageKey);
      return savedStaff ? JSON.parse(savedStaff) : [];
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
