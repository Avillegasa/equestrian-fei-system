import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import scoringService from '../services/scoringService';

const useScoringStore = create(devtools((set, get) => ({
  // =============== STATE ===============
  // Criterios de puntuación
  scoringCriteria: [],
  criteriaByDiscipline: {},
  criteriaLoading: false,
  criteriaError: null,

  // Scorecards
  scorecards: [],
  currentScorecard: null,
  scorecardsLoading: false,
  scorecardsError: null,

  // Puntuaciones individuales
  individualScores: [],
  scoresLoading: false,
  scoresError: null,

  // Disciplinas específicas
  jumpingFaults: [],
  dressageMovements: [],
  eventingPhases: [],

  // Rankings
  rankings: [],
  currentRanking: null,
  liveRankings: [],
  rankingsLoading: false,
  rankingsError: null,

  // Estadísticas
  competitionStats: null,
  judgeStats: null,
  statsLoading: false,
  statsError: null,

  // UI State
  activeTab: 'evaluation',
  selectedParticipant: null,
  isEvaluationMode: false,

  // =============== CRITERIOS DE PUNTUACIÓN ===============
  loadScoringCriteria: async (params = {}) => {
    set({ criteriaLoading: true, criteriaError: null });
    try {
      const criteria = await scoringService.getScoringCriteria(params);
      set({ 
        scoringCriteria: criteria.results || criteria,
        criteriaLoading: false 
      });
    } catch (error) {
      set({ 
        criteriaError: error.message,
        criteriaLoading: false 
      });
    }
  },

  loadCriteriaByDiscipline: async () => {
    set({ criteriaLoading: true, criteriaError: null });
    try {
      const criteriaByDiscipline = await scoringService.getScoringCriteriaByDiscipline();
      set({ 
        criteriaByDiscipline,
        criteriaLoading: false 
      });
    } catch (error) {
      set({ 
        criteriaError: error.message,
        criteriaLoading: false 
      });
    }
  },

  createScoringCriteria: async (criteriaData) => {
    try {
      const newCriteria = await scoringService.createScoringCriteria(criteriaData);
      set(state => ({ 
        scoringCriteria: [...state.scoringCriteria, newCriteria] 
      }));
      return { success: true, data: newCriteria };
    } catch (error) {
      set({ criteriaError: error.message });
      return { success: false, error: error.message };
    }
  },

  updateScoringCriteria: async (id, criteriaData) => {
    try {
      const updatedCriteria = await scoringService.updateScoringCriteria(id, criteriaData);
      set(state => ({
        scoringCriteria: state.scoringCriteria.map(c => 
          c.id === id ? updatedCriteria : c
        )
      }));
      return { success: true, data: updatedCriteria };
    } catch (error) {
      set({ criteriaError: error.message });
      return { success: false, error: error.message };
    }
  },

  // =============== SCORECARDS ===============
  loadScoreCards: async (params = {}) => {
    set({ scorecardsLoading: true, scorecardsError: null });
    try {
      const scorecards = await scoringService.getScoreCards(params);
      set({ 
        scorecards: scorecards.results || scorecards,
        scorecardsLoading: false 
      });
    } catch (error) {
      set({ 
        scorecardsError: error.message,
        scorecardsLoading: false 
      });
    }
  },

  loadScoreCardById: async (id) => {
    set({ scorecardsLoading: true, scorecardsError: null });
    try {
      const scorecard = await scoringService.getScoreCardById(id);
      set({ 
        currentScorecard: scorecard,
        scorecardsLoading: false 
      });
      return scorecard;
    } catch (error) {
      set({ 
        scorecardsError: error.message,
        scorecardsLoading: false 
      });
      throw error;
    }
  },

  createScoreCard: async (scorecardData) => {
    try {
      const newScorecard = await scoringService.createScoreCard(scorecardData);
      set(state => ({ 
        scorecards: [...state.scorecards, newScorecard] 
      }));
      return { success: true, data: newScorecard };
    } catch (error) {
      set({ scorecardsError: error.message });
      return { success: false, error: error.message };
    }
  },

  updateScoreCard: async (id, scorecardData) => {
    try {
      const updatedScorecard = await scoringService.updateScoreCard(id, scorecardData);
      set(state => ({
        scorecards: state.scorecards.map(s => 
          s.id === id ? updatedScorecard : s
        ),
        currentScorecard: state.currentScorecard?.id === id ? updatedScorecard : state.currentScorecard
      }));
      return { success: true, data: updatedScorecard };
    } catch (error) {
      set({ scorecardsError: error.message });
      return { success: false, error: error.message };
    }
  },

  // =============== ACCIONES DE SCORECARD ===============
  startEvaluation: async (scorecardId) => {
    try {
      const result = await scoringService.startEvaluation(scorecardId);
      
      // Actualizar estado del scorecard
      set(state => ({
        scorecards: state.scorecards.map(s => 
          s.id === scorecardId ? { ...s, status: 'in_progress' } : s
        ),
        currentScorecard: state.currentScorecard?.id === scorecardId 
          ? { ...state.currentScorecard, status: 'in_progress' } 
          : state.currentScorecard,
        isEvaluationMode: true
      }));
      
      return { success: true, message: result.message };
    } catch (error) {
      set({ scorecardsError: error.message });
      return { success: false, error: error.message };
    }
  },

  completeEvaluation: async (scorecardId) => {
    try {
      const result = await scoringService.completeEvaluation(scorecardId);
      
      // Recargar scorecard para obtener puntuaciones calculadas
      const updatedScorecard = await scoringService.getScoreCardById(scorecardId);
      
      set(state => ({
        scorecards: state.scorecards.map(s => 
          s.id === scorecardId ? updatedScorecard : s
        ),
        currentScorecard: state.currentScorecard?.id === scorecardId 
          ? updatedScorecard 
          : state.currentScorecard,
        isEvaluationMode: false
      }));
      
      return { success: true, message: result.message };
    } catch (error) {
      set({ scorecardsError: error.message });
      return { success: false, error: error.message };
    }
  },

  validateScores: async (scorecardId) => {
    try {
      const result = await scoringService.validateScores(scorecardId);
      
      set(state => ({
        scorecards: state.scorecards.map(s => 
          s.id === scorecardId ? { ...s, status: 'validated' } : s
        ),
        currentScorecard: state.currentScorecard?.id === scorecardId 
          ? { ...state.currentScorecard, status: 'validated' } 
          : state.currentScorecard
      }));
      
      return { success: true, message: result.message };
    } catch (error) {
      set({ scorecardsError: error.message });
      return { success: false, error: error.message };
    }
  },

  disqualifyParticipant: async (scorecardId, reason) => {
    try {
      const result = await scoringService.disqualifyParticipant(scorecardId, reason);
      
      set(state => ({
        scorecards: state.scorecards.map(s => 
          s.id === scorecardId ? { ...s, is_disqualified: true } : s
        ),
        currentScorecard: state.currentScorecard?.id === scorecardId 
          ? { ...state.currentScorecard, is_disqualified: true } 
          : state.currentScorecard
      }));
      
      return { success: true, message: result.message };
    } catch (error) {
      set({ scorecardsError: error.message });
      return { success: false, error: error.message };
    }
  },

  loadMyEvaluations: async () => {
    set({ scorecardsLoading: true, scorecardsError: null });
    try {
      const evaluations = await scoringService.getMyEvaluations();
      set({ 
        scorecards: evaluations,
        scorecardsLoading: false 
      });
    } catch (error) {
      set({ 
        scorecardsError: error.message,
        scorecardsLoading: false 
      });
    }
  },

  // =============== PUNTUACIONES INDIVIDUALES ===============
  loadIndividualScores: async (params = {}) => {
    set({ scoresLoading: true, scoresError: null });
    try {
      const scores = await scoringService.getIndividualScores(params);
      set({ 
        individualScores: scores.results || scores,
        scoresLoading: false 
      });
    } catch (error) {
      set({ 
        scoresError: error.message,
        scoresLoading: false 
      });
    }
  },

  createIndividualScore: async (scoreData) => {
    try {
      const newScore = await scoringService.createIndividualScore(scoreData);
      set(state => ({ 
        individualScores: [...state.individualScores, newScore] 
      }));
      
      // Actualizar el scorecard actual si corresponde
      if (get().currentScorecard?.id === scoreData.scorecard) {
        get().loadScoreCardById(scoreData.scorecard);
      }
      
      return { success: true, data: newScore };
    } catch (error) {
      set({ scoresError: error.message });
      return { success: false, error: error.message };
    }
  },

  updateIndividualScore: async (id, scoreData) => {
    try {
      const updatedScore = await scoringService.updateIndividualScore(id, scoreData);
      set(state => ({
        individualScores: state.individualScores.map(s => 
          s.id === id ? updatedScore : s
        )
      }));
      
      // Actualizar el scorecard actual
      const scorecard = get().currentScorecard;
      if (scorecard && scorecard.individual_scores?.some(s => s.id === id)) {
        get().loadScoreCardById(scorecard.id);
      }
      
      return { success: true, data: updatedScore };
    } catch (error) {
      set({ scoresError: error.message });
      return { success: false, error: error.message };
    }
  },

  deleteIndividualScore: async (id) => {
    try {
      await scoringService.deleteIndividualScore(id);
      set(state => ({
        individualScores: state.individualScores.filter(s => s.id !== id)
      }));
      return { success: true };
    } catch (error) {
      set({ scoresError: error.message });
      return { success: false, error: error.message };
    }
  },

  // =============== DISCIPLINAS ESPECÍFICAS ===============
  // Faltas de Salto
  loadJumpingFaults: async (params = {}) => {
    try {
      const faults = await scoringService.getJumpingFaults(params);
      set({ jumpingFaults: faults.results || faults });
    } catch (error) {
      console.error('Error cargando faltas de salto:', error);
    }
  },

  createJumpingFault: async (faultData) => {
    try {
      const newFault = await scoringService.createJumpingFault(faultData);
      set(state => ({ 
        jumpingFaults: [...state.jumpingFaults, newFault] 
      }));
      
      // Actualizar scorecard
      if (get().currentScorecard?.id === faultData.scorecard) {
        get().loadScoreCardById(faultData.scorecard);
      }
      
      return { success: true, data: newFault };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Movimientos de Doma
  loadDressageMovements: async (params = {}) => {
    try {
      const movements = await scoringService.getDressageMovements(params);
      set({ dressageMovements: movements.results || movements });
    } catch (error) {
      console.error('Error cargando movimientos de doma:', error);
    }
  },

  createDressageMovement: async (movementData) => {
    try {
      const newMovement = await scoringService.createDressageMovement(movementData);
      set(state => ({ 
        dressageMovements: [...state.dressageMovements, newMovement] 
      }));
      
      // Actualizar scorecard
      if (get().currentScorecard?.id === movementData.scorecard) {
        get().loadScoreCardById(movementData.scorecard);
      }
      
      return { success: true, data: newMovement };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Fases de Concurso Completo
  loadEventingPhases: async (params = {}) => {
    try {
      const phases = await scoringService.getEventingPhases(params);
      set({ eventingPhases: phases.results || phases });
    } catch (error) {
      console.error('Error cargando fases de concurso completo:', error);
    }
  },

  createEventingPhase: async (phaseData) => {
    try {
      const newPhase = await scoringService.createEventingPhase(phaseData);
      set(state => ({ 
        eventingPhases: [...state.eventingPhases, newPhase] 
      }));
      
      // Actualizar scorecard
      if (get().currentScorecard?.id === phaseData.scorecard) {
        get().loadScoreCardById(phaseData.scorecard);
      }
      
      return { success: true, data: newPhase };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // =============== RANKINGS ===============
  loadRankings: async (params = {}) => {
    set({ rankingsLoading: true, rankingsError: null });
    try {
      const rankings = await scoringService.getRankings(params);
      set({ 
        rankings: rankings.results || rankings,
        rankingsLoading: false 
      });
    } catch (error) {
      set({ 
        rankingsError: error.message,
        rankingsLoading: false 
      });
    }
  },

  loadRankingById: async (id) => {
    set({ rankingsLoading: true, rankingsError: null });
    try {
      const ranking = await scoringService.getRankingById(id);
      set({ 
        currentRanking: ranking,
        rankingsLoading: false 
      });
      return ranking;
    } catch (error) {
      set({ 
        rankingsError: error.message,
        rankingsLoading: false 
      });
      throw error;
    }
  },

  loadLiveRankings: async (competitionId) => {
    try {
      const rankings = await scoringService.getLiveRankings(competitionId);
      set({ liveRankings: rankings });
      return rankings;
    } catch (error) {
      set({ rankingsError: error.message });
      return [];
    }
  },

  publishRanking: async (id) => {
    try {
      const result = await scoringService.publishRanking(id);
      
      set(state => ({
        rankings: state.rankings.map(r => 
          r.id === id ? { ...r, is_published: true } : r
        ),
        currentRanking: state.currentRanking?.id === id 
          ? { ...state.currentRanking, is_published: true } 
          : state.currentRanking
      }));
      
      return { success: true, message: result.message };
    } catch (error) {
      set({ rankingsError: error.message });
      return { success: false, error: error.message };
    }
  },

  recalculateRanking: async (id) => {
    try {
      const result = await scoringService.recalculateRanking(id);
      
      // Recargar ranking actualizado
      const updatedRanking = await scoringService.getRankingById(id);
      set(state => ({
        rankings: state.rankings.map(r => 
          r.id === id ? updatedRanking : r
        ),
        currentRanking: state.currentRanking?.id === id 
          ? updatedRanking 
          : state.currentRanking
      }));
      
      return { success: true, message: result.message };
    } catch (error) {
      set({ rankingsError: error.message });
      return { success: false, error: error.message };
    }
  },

  // =============== ESTADÍSTICAS ===============
  loadCompetitionStats: async (competitionId) => {
    set({ statsLoading: true, statsError: null });
    try {
      const stats = await scoringService.getCompetitionSummary(competitionId);
      set({ 
        competitionStats: stats,
        statsLoading: false 
      });
    } catch (error) {
      set({ 
        statsError: error.message,
        statsLoading: false 
      });
    }
  },

  loadJudgeStats: async (judgeId = null) => {
    set({ statsLoading: true, statsError: null });
    try {
      const stats = await scoringService.getJudgeSummary(judgeId);
      set({ 
        judgeStats: stats,
        statsLoading: false 
      });
    } catch (error) {
      set({ 
        statsError: error.message,
        statsLoading: false 
      });
    }
  },

  // =============== UI ACTIONS ===============
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setSelectedParticipant: (participant) => set({ selectedParticipant: participant }),
  
  setEvaluationMode: (isActive) => set({ isEvaluationMode: isActive }),

  // =============== CLEAR ACTIONS ===============
  clearCurrentScorecard: () => set({ currentScorecard: null }),
  
  clearCurrentRanking: () => set({ currentRanking: null }),
  
  clearErrors: () => set({ 
    criteriaError: null,
    scorecardsError: null,
    scoresError: null,
    rankingsError: null,
    statsError: null
  }),

  // =============== RESET ===============
  reset: () => set({
    scoringCriteria: [],
    criteriaByDiscipline: {},
    scorecards: [],
    currentScorecard: null,
    individualScores: [],
    jumpingFaults: [],
    dressageMovements: [],
    eventingPhases: [],
    rankings: [],
    currentRanking: null,
    liveRankings: [],
    competitionStats: null,
    judgeStats: null,
    activeTab: 'evaluation',
    selectedParticipant: null,
    isEvaluationMode: false,
    criteriaLoading: false,
    scorecardsLoading: false,
    scoresLoading: false,
    rankingsLoading: false,
    statsLoading: false,
    criteriaError: null,
    scorecardsError: null,
    scoresError: null,
    rankingsError: null,
    statsError: null
  })
}), {
  name: 'scoring-store'
}));

export default useScoringStore;