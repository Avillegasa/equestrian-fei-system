import axios from 'axios';
import authService from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ScheduleService {
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
   * Obtener programación de una competencia específica
   */
  async getCompetitionSchedule(competitionId) {
    try {
      // Intentar API primero
      const response = await axios.get(
        `${API_BASE_URL}/competitions/schedule/?competition=${competitionId}`,
        { headers: this.getAuthHeaders() }
      );
      console.log('✅ Programación cargada desde API:', response.data);
      // DRF retorna {results: []} con paginación, extraer el array
      return response.data.results || response.data;
    } catch (error) {
      console.error('❌ Error al obtener programación desde API:', error);

      // Fallback a localStorage si la API falla
      if (this.useLocalStorage || !navigator.onLine) {
        console.log('⚠️ Usando localStorage como fallback para schedule');
        const storageKey = `fei_schedule_${competitionId}`;
        const savedSchedule = localStorage.getItem(storageKey);
        return savedSchedule ? JSON.parse(savedSchedule) : [];
      }

      throw error;
    }
  }

  /**
   * Crear evento en la programación
   */
  async createScheduleEvent(competitionId, eventData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/competitions/schedule/`,
        {
          competition: competitionId,
          ...eventData
        },
        { headers: this.getAuthHeaders() }
      );
      console.log('✅ Evento creado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear evento:', error);

      // Fallback a localStorage
      if (this.useLocalStorage || !navigator.onLine) {
        const storageKey = `fei_schedule_${competitionId}`;
        const schedule = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const maxId = schedule.length > 0 ? Math.max(...schedule.map(e => e.id || 0)) : 0;

        const newEvent = {
          id: maxId + 1,
          competition_id: competitionId,
          ...eventData,
          created_at: new Date().toISOString()
        };

        schedule.push(newEvent);
        localStorage.setItem(storageKey, JSON.stringify(schedule));
        console.log('✅ Evento guardado en localStorage:', newEvent);
        return newEvent;
      }

      throw error;
    }
  }

  /**
   * Actualizar evento en la programación
   */
  async updateScheduleEvent(eventId, eventData) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/competitions/schedule/${eventId}/`,
        eventData,
        { headers: this.getAuthHeaders() }
      );
      console.log('✅ Evento actualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al actualizar evento:', error);
      throw error;
    }
  }

  /**
   * Eliminar evento de la programación
   */
  async deleteScheduleEvent(eventId, competitionId = null) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/competitions/schedule/${eventId}/`,
        { headers: this.getAuthHeaders() }
      );
      console.log('✅ Evento eliminado');
      return response.data;
    } catch (error) {
      console.error('❌ Error al eliminar evento:', error);

      // Fallback a localStorage
      if (competitionId && (this.useLocalStorage || !navigator.onLine)) {
        const storageKey = `fei_schedule_${competitionId}`;
        const schedule = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updatedSchedule = schedule.filter(e => e.id != eventId);
        localStorage.setItem(storageKey, JSON.stringify(updatedSchedule));
        console.log('✅ Evento eliminado de localStorage');
        return {};
      }

      throw error;
    }
  }

  /**
   * Obtener programación por fecha
   */
  async getScheduleByDate(competitionId, startDate, endDate) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/competitions/schedule/by_date/`,
        {
          params: { competition: competitionId, start_date: startDate, end_date: endDate },
          headers: this.getAuthHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener programación por fecha:', error);
      throw error;
    }
  }
}

export default new ScheduleService();
