import { useState } from 'react';

const ApplyCompetitionModal = ({ isOpen, onClose, onConfirm, competition }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !competition) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(competition.id);
      onClose();
    } catch (error) {
      console.error('Error al inscribirse:', error);
      alert('❌ Error al inscribirse. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🏇</span>
              <div>
                <h2 className="text-2xl font-bold">Aplicar a Competencia</h2>
                <p className="text-sm text-blue-100">Confirma tu inscripción</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 text-2xl transition-colors"
              disabled={isSubmitting}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Información de la Competencia */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-5 mb-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
              <span className="mr-2">🏆</span>
              Detalles de la Competencia
            </h3>

            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3">
                <label className="text-xs font-medium text-gray-600">Nombre de la Competencia</label>
                <p className="text-base font-bold text-gray-900">{competition.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3">
                  <label className="text-xs font-medium text-gray-600">Disciplina</label>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{competition.discipline || 'No especificada'}</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <label className="text-xs font-medium text-gray-600">Ubicación</label>
                  <p className="text-sm text-gray-900">{competition.location || 'Por definir'}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3">
                <label className="text-xs font-medium text-gray-600">Fecha de Inicio</label>
                <p className="text-sm font-semibold text-gray-900">{formatDate(competition.startDate)}</p>
              </div>

              {competition.description && (
                <div className="bg-white rounded-lg p-3">
                  <label className="text-xs font-medium text-gray-600">Descripción</label>
                  <p className="text-sm text-gray-700">{competition.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Confirmación */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-yellow-900 mb-2">¿Estás seguro?</h4>
                <p className="text-sm text-yellow-800 mb-2">
                  Al confirmar tu inscripción, tu solicitud será enviada al organizador de la competencia.
                </p>
                <p className="text-xs text-yellow-700">
                  <strong>Nota:</strong> El organizador debe aprobar tu inscripción antes de que puedas participar oficialmente.
                </p>
              </div>
            </div>
          </div>

          {/* Proceso de Aprobación */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-bold text-green-900 mb-3 flex items-center">
              <span className="mr-2">📋</span>
              Proceso de Aprobación
            </h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">1.</span>
                <p className="text-xs text-green-800">Tu solicitud será enviada al organizador</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">2.</span>
                <p className="text-xs text-green-800">El organizador revisará y aprobará/rechazará tu inscripción</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">3.</span>
                <p className="text-xs text-green-800">Recibirás una notificación con el resultado</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">4.</span>
                <p className="text-xs text-green-800">Si es aprobada, podrás ver los rankings en tiempo real</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Botones */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <span>✅</span>
                <span>Confirmar Inscripción</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplyCompetitionModal;
