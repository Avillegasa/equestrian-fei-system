import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ScoringService {
  // =============== CRITERIOS DE PUNTUACIÓN ===============
  async getScoringCriteria(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/scoring-criteria/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo criterios de puntuación:', error);
      throw error;
    }
  }

  async getScoringCriteriaById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/scoring-criteria/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo criterio de puntuación:', error);
      throw error;
    }
  }

  async getScoringCriteriaByDiscipline() {
    try {
      const response = await axios.get(`${API_BASE_URL}/scoring-criteria/by_discipline/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo criterios por disciplina:', error);
      throw error;
    }
  }

  async createScoringCriteria(criteriaData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/scoring-criteria/`, criteriaData);
      return response.data;
    } catch (error) {
      console.error('Error creando criterio de puntuación:', error);
      throw error;
    }
  }

  async updateScoringCriteria(id, criteriaData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/scoring-criteria/${id}/`, criteriaData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando criterio:', error);
      throw error;
    }
  }

  // =============== SCORECARDS ===============
  async getScoreCards(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/scorecards/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo scorecards:', error);
      throw error;
    }
  }

  async getScoreCardById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/scorecards/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo scorecard:', error);
      throw error;
    }
  }

  async createScoreCard(scorecardData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/scorecards/`, scorecardData);
      return response.data;
    } catch (error) {
      console.error('Error creando scorecard:', error);
      throw error;
    }
  }

  async updateScoreCard(id, scorecardData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/scorecards/${id}/`, scorecardData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando scorecard:', error);
      throw error;
    }
  }

  // =============== ACCIONES DE SCORECARD ===============
  async startEvaluation(scorecardId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/scorecards/${scorecardId}/start_evaluation/`);
      return response.data;
    } catch (error) {
      console.error('Error iniciando evaluación:', error);
      throw error;
    }
  }

  async completeEvaluation(scorecardId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/scorecards/${scorecardId}/complete_evaluation/`);
      return response.data;
    } catch (error) {
      console.error('Error completando evaluación:', error);
      throw error;
    }
  }

  async validateScores(scorecardId) {
    try {
      const response = await axios.post(`${API_BASE_URL}/scorecards/${scorecardId}/validate_scores/`);
      return response.data;
    } catch (error) {
      console.error('Error validando puntuaciones:', error);
      throw error;
    }
  }

  async disqualifyParticipant(scorecardId, reason) {
    try {
      const response = await axios.post(`${API_BASE_URL}/scorecards/${scorecardId}/disqualify/`, {
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error descalificando participante:', error);
      throw error;
    }
  }

  async getMyEvaluations() {
    try {
      const response = await axios.get(`${API_BASE_URL}/scorecards/my_evaluations/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo mis evaluaciones:', error);
      throw error;
    }
  }

  // =============== PUNTUACIONES INDIVIDUALES ===============
  async getIndividualScores(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/individual-scores/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo puntuaciones individuales:', error);
      throw error;
    }
  }

  async createIndividualScore(scoreData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/individual-scores/`, scoreData);
      return response.data;
    } catch (error) {
      console.error('Error creando puntuación individual:', error);
      throw error;
    }
  }

  async updateIndividualScore(id, scoreData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/individual-scores/${id}/`, scoreData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando puntuación individual:', error);
      throw error;
    }
  }

  async deleteIndividualScore(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/individual-scores/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando puntuación individual:', error);
      throw error;
    }
  }

  // =============== FALTAS DE SALTO ===============
  async getJumpingFaults(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/jumping-faults/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo faltas de salto:', error);
      throw error;
    }
  }

  async createJumpingFault(faultData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/jumping-faults/`, faultData);
      return response.data;
    } catch (error) {
      console.error('Error creando falta de salto:', error);
      throw error;
    }
  }

  async updateJumpingFault(id, faultData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/jumping-faults/${id}/`, faultData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando falta de salto:', error);
      throw error;
    }
  }

  async deleteJumpingFault(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/jumping-faults/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando falta de salto:', error);
      throw error;
    }
  }

  // =============== MOVIMIENTOS DE DOMA ===============
  async getDressageMovements(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/dressage-movements/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo movimientos de doma:', error);
      throw error;
    }
  }

  async createDressageMovement(movementData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/dressage-movements/`, movementData);
      return response.data;
    } catch (error) {
      console.error('Error creando movimiento de doma:', error);
      throw error;
    }
  }

  async updateDressageMovement(id, movementData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/dressage-movements/${id}/`, movementData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando movimiento de doma:', error);
      throw error;
    }
  }

  async deleteDressageMovement(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/dressage-movements/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando movimiento de doma:', error);
      throw error;
    }
  }

  // =============== FASES DE CONCURSO COMPLETO ===============
  async getEventingPhases(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/eventing-phases/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo fases de concurso completo:', error);
      throw error;
    }
  }

  async createEventingPhase(phaseData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/eventing-phases/`, phaseData);
      return response.data;
    } catch (error) {
      console.error('Error creando fase de concurso completo:', error);
      throw error;
    }
  }

  async updateEventingPhase(id, phaseData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/eventing-phases/${id}/`, phaseData);
      return response.data;
    } catch (error) {
      console.error('Error actualizando fase de concurso completo:', error);
      throw error;
    }
  }

  async deleteEventingPhase(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/eventing-phases/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando fase de concurso completo:', error);
      throw error;
    }
  }

  // =============== RANKINGS ===============
  async getRankings(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/rankings/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo rankings:', error);
      throw error;
    }
  }

  async getRankingById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/rankings/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo ranking:', error);
      throw error;
    }
  }

  async publishRanking(id) {
    try {
      const response = await axios.post(`${API_BASE_URL}/rankings/${id}/publish/`);
      return response.data;
    } catch (error) {
      console.error('Error publicando ranking:', error);
      throw error;
    }
  }

  async recalculateRanking(id) {
    try {
      const response = await axios.post(`${API_BASE_URL}/rankings/${id}/recalculate/`);
      return response.data;
    } catch (error) {
      console.error('Error recalculando ranking:', error);
      throw error;
    }
  }

  async getLiveRankings(competitionId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/rankings/live/`, {
        params: { competition: competitionId }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo rankings en vivo:', error);

      // Fallback a localStorage - retornar rankings vacíos o datos de ejemplo
      console.log('💾 Usando fallback para rankings - competitionId:', competitionId);

      // Verificar si hay rankings guardados en localStorage
      const storedRankings = localStorage.getItem(`fei_rankings_${competitionId}`);
      if (storedRankings) {
        console.log('✅ Rankings encontrados en localStorage');
        return JSON.parse(storedRankings);
      }

      // Si no hay rankings, retornar estructura vacía
      console.log('📭 No hay rankings disponibles aún');
      return {
        results: [],
        count: 0,
        message: 'No hay rankings disponibles para esta competencia aún.'
      };
    }
  }

  // =============== ESTADÍSTICAS ===============
  async getCompetitionSummary(competitionId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics/competition_summary/`, {
        params: { competition: competitionId }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo resumen de competencia:', error);
      throw error;
    }
  }

  async getJudgeSummary(judgeId = null) {
    try {
      const params = judgeId ? { judge: judgeId } : {};
      const response = await axios.get(`${API_BASE_URL}/statistics/judge_summary/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo resumen de juez:', error);
      throw error;
    }
  }

  // =============== UTILIDADES ===============
  async exportRanking(rankingId, format = 'csv') {
    try {
      const response = await axios.get(`${API_BASE_URL}/rankings/${rankingId}/export/`, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exportando ranking:', error);
      throw error;
    }
  }

  // =============== VALIDACIONES ===============
  validateIndividualScore(scoreData, criteria) {
    const errors = {};

    if (!scoreData.raw_score && scoreData.raw_score !== 0) {
      errors.raw_score = 'La puntuación es requerida';
    } else {
      const score = parseFloat(scoreData.raw_score);
      if (score < criteria.min_score || score > criteria.max_score) {
        errors.raw_score = `La puntuación debe estar entre ${criteria.min_score} y ${criteria.max_score}`;
      }
    }

    if (!scoreData.criteria) {
      errors.criteria = 'El criterio es requerido';
    }

    if (!scoreData.scorecard) {
      errors.scorecard = 'El scorecard es requerido';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  validateJumpingFault(faultData) {
    const errors = {};

    if (!faultData.obstacle_number) {
      errors.obstacle_number = 'El número de obstáculo es requerido';
    }

    if (!faultData.fault_type) {
      errors.fault_type = 'El tipo de falta es requerido';
    }

    if (!faultData.penalty_points && faultData.penalty_points !== 0) {
      errors.penalty_points = 'Los puntos de penalización son requeridos';
    } else if (parseFloat(faultData.penalty_points) < 0) {
      errors.penalty_points = 'Los puntos de penalización no pueden ser negativos';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  validateDressageMovement(movementData) {
    const errors = {};

    if (!movementData.movement_number) {
      errors.movement_number = 'El número de movimiento es requerido';
    }

    if (!movementData.movement_name) {
      errors.movement_name = 'El nombre del movimiento es requerido';
    }

    if (!movementData.score && movementData.score !== 0) {
      errors.score = 'La puntuación es requerida';
    } else {
      const score = parseFloat(movementData.score);
      if (score < 0 || score > 10) {
        errors.score = 'La puntuación debe estar entre 0 y 10';
      }
    }

    if (!movementData.coefficient) {
      errors.coefficient = 'El coeficiente es requerido';
    } else if (parseFloat(movementData.coefficient) <= 0) {
      errors.coefficient = 'El coeficiente debe ser positivo';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // =============== UTILIDADES DE PUNTUACIÓN ===============
  calculateWeightedScore(rawScore, weight) {
    return parseFloat(rawScore) * parseFloat(weight);
  }

  calculatePercentageScore(totalScore, maxPossibleScore) {
    if (maxPossibleScore === 0) return 0;
    return (totalScore / maxPossibleScore) * 100;
  }

  formatScore(score, decimals = 2) {
    return parseFloat(score).toFixed(decimals);
  }

  getScoreColor(score, maxScore) {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  }

  getStatusColor(status) {
    const colors = {
      'pending': 'bg-gray-100 text-gray-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'validated': 'bg-green-200 text-green-900',
      'published': 'bg-purple-100 text-purple-800',
      'disputed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusText(status) {
    const statusTexts = {
      'pending': 'Pendiente',
      'in_progress': 'En Progreso',
      'completed': 'Completada',
      'validated': 'Validada',
      'published': 'Publicada',
      'disputed': 'En Disputa'
    };
    return statusTexts[status] || status;
  }
}

// Crear instancia singleton
const scoringService = new ScoringService();

export default scoringService;