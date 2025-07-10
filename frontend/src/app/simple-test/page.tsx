'use client';

// frontend/src/app/simple-test/page.tsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

function SimpleScoreInput() {
  const [score, setScore] = useState(7.5);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async () => {
    try {
      console.log('🔄 Enviando puntuación:', score);
      
      const response = await fetch('/api/scores/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: 'test',
          judge_id: 'test',
          evaluation_id: 'test',
          score: score
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Éxito:', result);
        toast.success('¡Funciona!');
      } else {
        console.error('❌ Error response:', response.status);
        toast.error(`Error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Error de conexión');
    }
  };

  if (!mounted) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <style jsx>{`
        input[type="number"] {
          color: #000000 !important;
          font-weight: bold !important;
          font-size: 1.5rem !important;
          background: white !important;
        }
      `}</style>
      
      <h1 className="text-2xl font-bold mb-6">Test Ultra Simple</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Puntuación:
          </label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.5"
            value={score}
            onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
            className="w-24 px-3 py-2 border rounded text-center font-bold text-lg"
            style={{
              color: '#000000',
              fontWeight: 'bold',
              fontSize: '1.5rem'
            }}
          />
        </div>
        
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test API
        </button>
        
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="text-sm">
            Valor actual: <span className="font-bold">{score}</span>
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Los números deberían verse en NEGRO y en negrita.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SimpleScoreInput;