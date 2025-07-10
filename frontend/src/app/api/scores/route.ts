// frontend/src/app/api/scores/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 API POST /api/scores/ llamada');
    
    const body = await request.json();
    console.log('📝 Datos recibidos:', body);
    
    // Simular procesamiento
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const response = {
      success: true,
      data: {
        id: `score_${Date.now()}`,
        ...body,
        timestamp: new Date().toISOString()
      },
      message: 'Puntuación guardada correctamente'
    };
    
    console.log('✅ Respuesta enviada:', response);
    
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('❌ Error en API:', error);
    return NextResponse.json(
      { error: 'Error procesando puntuación', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API de scores funcionando',
    timestamp: new Date().toISOString()
  });
}