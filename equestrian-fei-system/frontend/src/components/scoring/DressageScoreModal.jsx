import { useState, useEffect, useMemo } from 'react';

/**
 * Modal de Calificación de Adiestramiento/Dressage
 * Basado en las tablas de cómputos FEI
 *
 * Estructura:
 * - Ejercicios individuales (1-34 según tabla)
 * - Notas del 0-10 por ejercicio
 * - Coeficientes multiplicadores
 * - Notas de conjunto (collective marks)
 * - Cálculo automático de totales y porcentajes
 */

// Plantilla: FUTUROS CAMPEONES TABLA A (2023 USDF INTRODUCTORIA)
const TABLA_FUTUROS_CAMPEONES_A = {
  id: 'futuros_campeones_a',
  name: 'FUTUROS CAMPEONES - TABLA A',
  description: '2023 USDF INTRODUCTORIA - TABLA A',
  maxScore: 160,
  exercises: [
    { number: 1, maxNote: 10, coefficient: 1, description: 'Entrada y alto' },
    { number: 2, maxNote: 10, coefficient: 1, description: 'Seguir pista' },
    { number: 3, maxNote: 10, coefficient: 1, description: 'Circulo 20m' },
    { number: 4, maxNote: 10, coefficient: 1, description: 'Diagonal cambio mano' },
    { number: 5, maxNote: 10, coefficient: 1, description: 'Circulo 20m' },
    { number: 6, maxNote: 10, coefficient: 1, description: 'Seguir pista' },
    { number: 7, maxNote: 10, coefficient: 1, description: 'Alto saludo' },
    { number: 8, maxNote: 10, coefficient: 1, description: 'Transición' },
    { number: 9, maxNote: 10, coefficient: 1, description: 'Salida' }
  ],
  collectiveMarks: [
    { number: 1, name: 'Aires', maxNote: 10, coefficient: 1 },
    { number: 2, name: 'Impulsión', maxNote: 10, coefficient: 1 },
    { number: 3, name: 'Sumisión', maxNote: 10, coefficient: 2 },
    { number: 4, name: 'Posición del jinete', maxNote: 10, coefficient: 1 },
    { number: 5, name: 'Efectividad de las ayudas', maxNote: 10, coefficient: 1 },
    { number: 6, name: 'Armonía binomio', maxNote: 10, coefficient: 1 }
  ]
};

// Plantilla: PRIMERA YOUNG RIDERS
const TABLA_YOUNG_RIDERS = {
  id: 'young_riders_prix_st_george',
  name: 'YOUNG RIDERS TEAM - PRIX ST GEORGE',
  description: 'CATEGORIA PRIMERA - TABLA 1',
  maxScore: 340,
  exercises: Array.from({ length: 34 }, (_, i) => ({
    number: i + 1,
    maxNote: 10,
    coefficient: [5, 18, 23, 28].includes(i + 1) ? 2 : 1, // Algunos ejercicios tienen coef 2
    description: `Ejercicio ${i + 1}`
  })),
  collectiveMarks: [
    { number: 1, name: 'Aires', maxNote: 10, coefficient: 1 },
    { number: 2, name: 'Impulsión', maxNote: 10, coefficient: 1 },
    { number: 3, name: 'Sumisión', maxNote: 10, coefficient: 2 },
    { number: 4, name: 'Posición del jinete', maxNote: 10, coefficient: 1 },
    { number: 5, name: 'Efectividad de las ayudas', maxNote: 10, coefficient: 1 },
    { number: 6, name: 'Armonía binomio', maxNote: 10, coefficient: 1 }
  ]
};

// Catálogo de plantillas disponibles
const DRESSAGE_TEMPLATES = {
  futuros_campeones_a: TABLA_FUTUROS_CAMPEONES_A,
  young_riders: TABLA_YOUNG_RIDERS
};

const DressageScoreModal = ({
  isOpen,
  onClose,
  onSubmit,
  participant,
  existingScore,
  template = 'futuros_campeones_a',
  judgePosition = 'C' // C, B, H, E, M
}) => {
  const tableTemplate = DRESSAGE_TEMPLATES[template] || TABLA_FUTUROS_CAMPEONES_A;

  // Estado de ejercicios: { exerciseNumber: note }
  const [exercises, setExercises] = useState({});

  // Estado de notas de conjunto: { markNumber: note }
  const [collectiveMarks, setCollectiveMarks] = useState({});

  // Comentarios adicionales
  const [comments, setComments] = useState('');

  // Cargar datos existentes si los hay
  useEffect(() => {
    if (existingScore) {
      setExercises(existingScore.exercises || {});
      setCollectiveMarks(existingScore.collectiveMarks || {});
      setComments(existingScore.comments || '');
    } else {
      // Resetear
      setExercises({});
      setCollectiveMarks({});
      setComments('');
    }
  }, [existingScore, isOpen]);

  // Calcular subtotal de ejercicios
  const exercisesSubtotal = useMemo(() => {
    let total = 0;
    let noteCount = 0;

    tableTemplate.exercises.forEach(ex => {
      const note = parseFloat(exercises[ex.number]) || 0;
      const coef = ex.coefficient || 1;
      total += note * coef;
      noteCount += note > 0 ? 1 : 0;
    });

    return { total, noteCount };
  }, [exercises, tableTemplate]);

  // Calcular subtotal de notas de conjunto
  const collectiveSubtotal = useMemo(() => {
    let total = 0;
    let noteCount = 0;

    tableTemplate.collectiveMarks.forEach(mark => {
      const note = parseFloat(collectiveMarks[mark.number]) || 0;
      const coef = mark.coefficient || 1;
      total += note * coef;
      noteCount += note > 0 ? 1 : 0;
    });

    return { total, noteCount };
  }, [collectiveMarks, tableTemplate]);

  // Calcular total final y porcentaje
  const finalScore = useMemo(() => {
    const total = exercisesSubtotal.total + collectiveSubtotal.total;
    const percentage = (total / tableTemplate.maxScore) * 100;

    return {
      total: total.toFixed(2),
      percentage: percentage.toFixed(2),
      maxScore: tableTemplate.maxScore
    };
  }, [exercisesSubtotal, collectiveSubtotal, tableTemplate]);

  // Manejar cambio de nota de ejercicio
  const handleExerciseChange = (exerciseNumber, value) => {
    const note = parseFloat(value);

    // Validar rango 0-10
    if (value === '' || (note >= 0 && note <= 10)) {
      setExercises(prev => ({
        ...prev,
        [exerciseNumber]: value
      }));
    }
  };

  // Manejar cambio de nota de conjunto
  const handleCollectiveChange = (markNumber, value) => {
    const note = parseFloat(value);

    // Validar rango 0-10
    if (value === '' || (note >= 0 && note <= 10)) {
      setCollectiveMarks(prev => ({
        ...prev,
        [markNumber]: value
      }));
    }
  };

  // Botones rápidos para notas comunes
  const QuickNoteButtons = ({ exerciseNumber, isCollective = false }) => {
    const commonNotes = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5];

    return (
      <div className="flex space-x-1 mt-1">
        {commonNotes.map(note => (
          <button
            key={note}
            type="button"
            onClick={() =>
              isCollective
                ? handleCollectiveChange(exerciseNumber, note.toString())
                : handleExerciseChange(exerciseNumber, note.toString())
            }
            className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors duration-150"
          >
            {note}
          </button>
        ))}
      </div>
    );
  };

  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    const scoreData = {
      exercises,
      collectiveMarks,
      exercisesSubtotal: exercisesSubtotal.total,
      collectiveSubtotal: collectiveSubtotal.total,
      totalScore: parseFloat(finalScore.total),
      percentage: parseFloat(finalScore.percentage),
      maxScore: tableTemplate.maxScore,
      template: template,
      judgePosition,
      comments
    };

    onSubmit(scoreData);
    onClose();
  };

  if (!isOpen || !participant) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-11/12 max-w-6xl shadow-2xl rounded-xl bg-white mb-8">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                🎯 Calificación de Adiestramiento
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {tableTemplate.name} - Puntuación Máxima: {tableTemplate.maxScore}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ✕
            </button>
          </div>

          {/* Información del Participante */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mt-4 border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600 font-medium">Jinete/Amazona</p>
                <p className="text-lg font-bold text-gray-900">
                  {participant.rider.first_name} {participant.rider.last_name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Caballo</p>
                <p className="text-lg font-bold text-gray-900">
                  {participant.horse.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Posición del Juez</p>
                <p className="text-lg font-bold text-purple-700">
                  {judgePosition}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Columna Izquierda: Ejercicios */}
            <div className="lg:col-span-2">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📝</span>
                  Ejercicios Individuales
                </h4>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {tableTemplate.exercises.map((exercise) => (
                    <div
                      key={exercise.number}
                      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-bold">
                            #{exercise.number}
                          </span>
                          <span className="text-sm text-gray-700 flex-1">
                            {exercise.description}
                          </span>
                          {exercise.coefficient > 1 && (
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                              x{exercise.coefficient}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={exercises[exercise.number] || ''}
                            onChange={(e) => handleExerciseChange(exercise.number, e.target.value)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-bold text-lg"
                            placeholder="0-10"
                          />
                          {exercises[exercise.number] && exercise.coefficient > 1 && (
                            <span className="text-sm font-medium text-gray-700">
                              = {(parseFloat(exercises[exercise.number]) * exercise.coefficient).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <QuickNoteButtons exerciseNumber={exercise.number} />
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Subtotal Ejercicios:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {exercisesSubtotal.total.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {exercisesSubtotal.noteCount} / {tableTemplate.exercises.length} ejercicios calificados
                  </p>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Notas de Conjunto y Resumen */}
            <div className="space-y-4">
              {/* Notas de Conjunto */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">⭐</span>
                  Notas de Conjunto
                </h4>

                <div className="space-y-3">
                  {tableTemplate.collectiveMarks.map((mark) => (
                    <div key={mark.number} className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {mark.name}
                        </span>
                        {mark.coefficient > 1 && (
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                            x{mark.coefficient}
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={collectiveMarks[mark.number] || ''}
                        onChange={(e) => handleCollectiveChange(mark.number, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center font-bold"
                        placeholder="0-10"
                      />
                      <QuickNoteButtons exerciseNumber={mark.number} isCollective={true} />
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-purple-300">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Subtotal Conjunto:</span>
                    <span className="text-xl font-bold text-purple-600">
                      {collectiveSubtotal.total.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resumen Total */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-400">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Puntuación Final
                </h4>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal Ejercicios:</span>
                    <span className="font-bold text-gray-900">{exercisesSubtotal.total.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Subtotal Conjunto:</span>
                    <span className="font-bold text-gray-900">{collectiveSubtotal.total.toFixed(1)}</span>
                  </div>
                  <div className="border-t-2 border-green-400 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900 text-lg">Total:</span>
                      <span className="text-3xl font-bold text-green-600">
                        {finalScore.total}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">Máximo: {finalScore.maxScore}</span>
                      <span className="text-2xl font-bold text-green-700">
                        {finalScore.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comentarios */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentarios del Juez
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Observaciones sobre la presentación..."
                />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-bold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              💾 Guardar Calificación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DressageScoreModal;
