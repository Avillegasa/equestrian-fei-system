// frontend/src/app/api/scores/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Store temporal para simular datos
let mockScores: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos básicos
    const { participant_id, judge_id, evaluation_id, score } = body;
    
    if (!participant_id || !judge_id || !evaluation_id || score === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar rango de puntuación FEI
    if (score < 0 || score > 10 || (score * 2) % 1 !== 0) {
      return NextResponse.json(
        { error: 'Puntuación debe estar entre 0 y 10 en incrementos de 0.5' },
        { status: 400 }
      );
    }

    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 100));

    // Crear registro de puntuación
    const scoreRecord = {
      id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      participant_id,
      judge_id,
      evaluation_id,
      score,
      timestamp: new Date().toISOString(),
      synced: true
    };

    // Almacenar en "base de datos" mock
    mockScores.push(scoreRecord);

    console.log('✅ Mock API: Puntuación guardada:', scoreRecord);

    return NextResponse.json({
      success: true,
      data: scoreRecord,
      message: 'Puntuación guardada correctamente'
    });

  } catch (error) {
    console.error('❌ Mock API Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const participant_id = searchParams.get('participant_id');
    const judge_id = searchParams.get('judge_id');

    let filteredScores = mockScores;

    if (participant_id) {
      filteredScores = filteredScores.filter(s => s.participant_id === participant_id);
    }

    if (judge_id) {
      filteredScores = filteredScores.filter(s => s.judge_id === judge_id);
    }

    return NextResponse.json({
      success: true,
      data: filteredScores,
      count: filteredScores.length
    });

  } catch (error) {
    console.error('❌ Mock API Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para limpiar datos de testing
export async function DELETE() {
  mockScores = [];
  return NextResponse.json({
    success: true,
    message: 'Datos de testing limpiados'
  });
}