import { useState, useEffect } from 'react';

const ScoreParticipantModal = ({ isOpen, onClose, onSubmit, participant, existingScore }) => {
  const [formData, setFormData] = useState({
    time_seconds: '',
    faults: '0',
    time_faults: '0',
    refusals: '0',
    notes: ''
  });

  useEffect(() => {
    if (existingScore) {
      setFormData({
        time_seconds: existingScore.time_seconds?.toString() || '',
        faults: existingScore.faults?.toString() || '0',
        time_faults: existingScore.time_faults?.toString() || '0',
        refusals: existingScore.refusals?.toString() || '0',
        notes: existingScore.notes || ''
      });
    } else {
      setFormData({
        time_seconds: '',
        faults: '0',
        time_faults: '0',
        refusals: '0',
        notes: ''
      });
    }
  }, [existingScore, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuickFault = (faultValue) => {
    setFormData(prev => ({
      ...prev,
      faults: (parseInt(prev.faults) + faultValue).toString()
    }));
  };

  const handleQuickRefusal = () => {
    setFormData(prev => ({
      ...prev,
      refusals: (parseInt(prev.refusals) + 1).toString()
    }));
  };

  const calculateFinalScore = () => {
    const faults = parseInt(formData.faults) || 0;
    const timeFaults = parseFloat(formData.time_faults) || 0;
    const refusals = parseInt(formData.refusals) || 0;
    return faults + timeFaults + (refusals * 4);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const resetForm = () => {
    setFormData({
      time_seconds: '',
      faults: '0',
      time_faults: '0',
      refusals: '0',
      notes: ''
    });
  };

  if (!isOpen || !participant) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-3xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between pb-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              ⚖️ Calificar Participante #{participant.bib_number}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Información del Participante */}
          <div className="bg-blue-50 p-4 rounded-lg mt-4">
            <h4 className="text-lg font-semibold text-blue-900 mb-2">
              👤 {participant.rider.first_name} {participant.rider.last_name} + {participant.horse.name}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p><strong>Categoría:</strong> {participant.category}</p>
                <p><strong>Orden de Salida:</strong> {participant.order}</p>
              </div>
              <div>
                <p><strong>Número de Dorsal:</strong> #{participant.bib_number}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-6">

            {/* Tiempo */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-green-900 mb-4">⏱️ Tiempo de Recorrido</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tiempo (segundos) *
                  </label>
                  <input
                    type="number"
                    name="time_seconds"
                    required
                    step="0.01"
                    min="0"
                    value={formData.time_seconds}
                    onChange={handleChange}
                    placeholder="65.50"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Penalizaciones por Tiempo
                  </label>
                  <input
                    type="number"
                    name="time_faults"
                    step="0.01"
                    min="0"
                    value={formData.time_faults}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    1 punto por cada segundo excedido del tiempo permitido
                  </p>
                </div>
              </div>
            </div>

            {/* Faltas */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-red-900 mb-4">❌ Penalizaciones por Faltas</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Puntos de Penalización
                  </label>
                  <input
                    type="number"
                    name="faults"
                    min="0"
                    step="4"
                    value={formData.faults}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />

                  {/* Botones rápidos para faltas */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickFault(4)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                    >
                      +4 (Derribo)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFault(8)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                    >
                      +8 (2 Derribos)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFault(12)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                    >
                      +12 (3 Derribos)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, faults: '0' }))}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Desobediencias/Rehusos
                  </label>
                  <input
                    type="number"
                    name="refusals"
                    min="0"
                    max="2"
                    value={formData.refusals}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />

                  {/* Botones rápidos para rehusos */}
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleQuickRefusal}
                      className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
                    >
                      +1 Rehuso
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, refusals: '0' }))}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                    >
                      Reset
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    4 puntos por cada desobediencia. 2 = Eliminación
                  </p>
                </div>
              </div>
            </div>

            {/* Puntuación Final Preview */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-purple-900 mb-2">📊 Puntuación Final</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-600">Faltas de Obstáculo</p>
                  <p className="text-xl font-bold text-red-600">{formData.faults}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Faltas de Tiempo</p>
                  <p className="text-xl font-bold text-orange-600">{formData.time_faults}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Rehusos (x4)</p>
                  <p className="text-xl font-bold text-yellow-600">{parseInt(formData.refusals) * 4}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">TOTAL</p>
                  <p className="text-2xl font-bold text-purple-600">{calculateFinalScore()}</p>
                </div>
              </div>
              <p className="text-xs text-purple-700 mt-2 text-center">
                Menor puntuación = mejor resultado • En caso de empate, gana el menor tiempo
              </p>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notas / Observaciones
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Observaciones sobre la actuación, incidentes, etc..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Reglas FEI Recordatorio */}
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-blue-600">📖</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    Recordatorio - Reglas FEI Salto Ecuestre
                  </h4>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Derribo:</strong> 4 puntos por obstáculo derribado</li>
                      <li><strong>1ra Desobediencia:</strong> 4 puntos (rehuso, escape, resistencia)</li>
                      <li><strong>2da Desobediencia:</strong> Eliminación</li>
                      <li><strong>Tiempo:</strong> 1 punto por cada segundo excedido</li>
                      <li><strong>Caída del jinete:</strong> Eliminación inmediata</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-between space-x-3 pt-4 border-t">
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  🔄 Resetear
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
              </div>
              <button
                type="submit"
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {existingScore ? '✏️ Actualizar Calificación' : '✅ Registrar Calificación'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScoreParticipantModal;