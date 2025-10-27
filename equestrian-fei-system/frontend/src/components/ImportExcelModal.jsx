import { useState } from 'react';
import { readExcelFile, parseDressageTable } from '../services/excelService';

/**
 * Modal para importar tablas de cómputos desde Excel
 */
const ImportExcelModal = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validar extensión
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      setError('Por favor selecciona un archivo Excel válido (.xlsx o .xls)');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Preview automático
    try {
      setLoading(true);
      const excelData = await readExcelFile(selectedFile);
      const parsedTemplate = parseDressageTable(excelData);
      setPreview(parsedTemplate);
      setLoading(false);
    } catch (err) {
      console.error('Error al previsualizar archivo:', err);
      setError('Error al leer el archivo. Verifica que sea un Excel válido.');
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!preview) return;

    onImport(preview);
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-8 border w-full max-w-4xl shadow-2xl rounded-xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-3">📤</span>
              Importar Tabla de Cómputos
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Sube un archivo Excel con la estructura de calificación FEI
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* File Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📁 Seleccionar Archivo Excel
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors duration-200">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Subir un archivo</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">o arrastra y suelta</p>
              </div>
              <p className="text-xs text-gray-500">
                Excel (.xlsx, .xls) hasta 10MB
              </p>
              {file && (
                <p className="text-sm font-medium text-green-600 mt-2">
                  ✓ {file.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mb-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Analizando archivo...</p>
          </div>
        )}

        {/* Preview */}
        {preview && !loading && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="text-lg font-bold text-green-900 mb-4 flex items-center">
              <span className="mr-2">✅</span>
              Vista Previa de la Tabla
            </h4>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Nombre:</p>
                <p className="font-medium text-gray-900">{preview.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Puntuación Máxima:</p>
                <p className="font-medium text-gray-900">{preview.maxScore} puntos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ejercicios */}
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-bold text-gray-900 mb-3">
                  📋 Ejercicios ({preview.exercises.length})
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {preview.exercises.map((ex) => (
                    <div key={ex.number} className="flex items-center justify-between text-sm border-b border-gray-200 pb-2">
                      <span className="text-gray-900">
                        {ex.number}. {ex.description.substring(0, 30)}...
                      </span>
                      <span className="font-bold text-blue-600">
                        x{ex.coefficient}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notas de Conjunto */}
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-bold text-gray-900 mb-3">
                  ⭐ Notas de Conjunto ({preview.collectiveMarks.length})
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {preview.collectiveMarks.map((cm) => (
                    <div key={cm.number} className="flex items-center justify-between text-sm border-b border-gray-200 pb-2">
                      <span className="text-gray-900">{cm.name}</span>
                      <span className="font-bold text-purple-600">
                        x{cm.coefficient}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-green-700">
                La tabla está lista para ser importada y utilizada en las calificaciones
              </p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-bold text-blue-900 mb-2">
            💡 Formato Esperado del Excel:
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Sección de "Ejercicios" o "Movements" con número, descripción y coeficiente</li>
            <li>• Sección de "Notas de Conjunto" o "Collective Marks"</li>
            <li>• Los coeficientes deben estar en la última columna</li>
            <li>• El sistema intentará detectar automáticamente la estructura</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!preview || loading}
            className={`px-6 py-3 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
              preview && !loading
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Procesando...' : 'Importar Tabla'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportExcelModal;
