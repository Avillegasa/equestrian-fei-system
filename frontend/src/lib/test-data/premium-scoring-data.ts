// src/lib/test-data/premium-scoring-data.ts

export const mockParticipants = [
  {
    id: 1,
    rider_name: "María González",
    horse_name: "Thunder Spirit",
    participant_number: "001",
    category: "Categoría Intermedia I",
    nationality: "ESP",
    club: "Club Ecuestre Madrid",
    age: 28,
    horse_age: 8,
    horse_breed: "Pura Raza Española",
    photo_url: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=600&fit=crop&crop=face",
    horse_photo_url: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=300&h=300&fit=crop"
  },
  {
    id: 2,
    rider_name: "Carlos Rodríguez",
    horse_name: "Golden Eagle",
    participant_number: "002",
    category: "Categoría Intermedia I",
    nationality: "MEX",
    club: "Rancho San Miguel",
    age: 35,
    horse_age: 10,
    horse_breed: "Hanoveriano",
    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&crop=face",
    horse_photo_url: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300&h=300&fit=crop"
  },
  {
    id: 3,
    rider_name: "Ana Silva",
    horse_name: "Midnight Star",
    participant_number: "003",
    category: "Categoría Intermedia I",
    nationality: "ARG",
    club: "Polo Club Buenos Aires",
    age: 24,
    horse_age: 6,
    horse_breed: "Warmblood",
    photo_url: "https://images.unsplash.com/photo-1494790108755-2616b612b1c0?w=400&h=600&fit=crop&crop=face",
    horse_photo_url: "https://images.unsplash.com/photo-1574757251765-cab7df2f8e80?w=300&h=300&fit=crop"
  },
  {
    id: 4,
    rider_name: "Pedro Morales",
    horse_name: "Royal Dream",
    participant_number: "004",
    category: "Categoría Intermedia I",
    nationality: "CHI",
    club: "Club de Campo Santiago",
    age: 31,
    horse_age: 9,
    horse_breed: "Lusitano",
    photo_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop&crop=face",
    horse_photo_url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop"
  }
];

export const mockEvaluationParameters = [
  {
    id: 1,
    name: "Paso Libre",
    description: "Evaluación del paso natural y libre del caballo",
    coefficient: 2,
    max_score: 10,
    current_score: 7.5,
    is_scored: true,
    needs_justification: false
  },
  {
    id: 2,
    name: "Trote Reunido",
    description: "Calidad del trote reunido con equilibrio y cadencia",
    coefficient: 2,
    max_score: 10,
    current_score: 6.0,
    is_scored: true,
    needs_justification: false
  },
  {
    id: 3,
    name: "Galope de Trabajo",
    description: "Galope equilibrado con transiciones fluidas",
    coefficient: 2,
    max_score: 10,
    is_scored: false,
    needs_justification: false
  },
  {
    id: 4,
    name: "Transiciones",
    description: "Fluidez y precisión en las transiciones entre aires",
    coefficient: 3,
    max_score: 10,
    is_scored: false,
    needs_justification: false
  },
  {
    id: 5,
    name: "Impulsión",
    description: "Energía y deseo de avanzar del caballo",
    coefficient: 2,
    max_score: 10,
    is_scored: false,
    needs_justification: false
  },
  {
    id: 6,
    name: "Sumisión",
    description: "Obediencia y cooperación del caballo con el jinete",
    coefficient: 2,
    max_score: 10,
    is_scored: false,
    needs_justification: false
  },
  {
    id: 7,
    name: "Posición del Jinete",
    description: "Asiento, postura y uso de las ayudas",
    coefficient: 2,
    max_score: 10,
    is_scored: false,
    needs_justification: false
  },
  {
    id: 8,
    name: "Impresión General",
    description: "Armonía general de la presentación",
    coefficient: 3,
    max_score: 10,
    is_scored: false,
    needs_justification: false
  }
];

export const mockScoringSession = {
  id: 1,
  competition_id: 1,
  competition_name: "Copa Nacional de Doma Clásica 2024",
  category_id: 1,
  category_name: "Categoría Intermedia I",
  judge_id: 1,
  judge_name: "Dr. Fernando López",
  participants: mockParticipants,
  evaluation_parameters: mockEvaluationParameters,
  current_participant_index: 0,
  session_status: 'active' as const,
  started_at: new Date().toISOString(),
  last_activity: new Date().toISOString(),
  auto_save_enabled: true,
  offline_mode: false,
  sync_status: 'synced' as const
};

// Función para simular API calls
export const mockApiDelay = (ms: number = 1000) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const mockScoringApi = {
  getScoringSession: async (sessionId: number) => {
    await mockApiDelay(800);
    return { ...mockScoringSession, id: sessionId };
  },

  saveScore: async (scoreData: any) => {
    await mockApiDelay(500);
    return {
      id: Math.random(),
      ...scoreData,
      saved_at: new Date().toISOString()
    };
  },

  updateParticipantScore: (participantId: number, parameterId: number, score: number) => {
    const participant = mockParticipants.find(p => p.id === participantId);
    const parameter = mockEvaluationParameters.find(p => p.id === parameterId);
    
    if (parameter) {
      parameter.current_score = score;
      parameter.is_scored = true;
      parameter.needs_justification = score <= 3.0 || score >= 8.5;
    }
    
    return { participant, parameter, updated: true };
  }
};