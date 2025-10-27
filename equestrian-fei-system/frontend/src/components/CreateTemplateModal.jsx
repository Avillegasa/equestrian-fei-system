import { useState, useEffect } from 'react';
import { downloadTemplateExcelExample } from '../services/excelService';

const CreateTemplateModal = ({ isOpen, onClose, onSubmit, initialData = null, isEditMode = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discipline: 'dressage',
    exercises: [],
    collectiveMarks: []
  });

  const [newExercise, setNewExercise] = useState({
    number: 1,
    description: '',
    coefficient: 1,
    maxScore: 10
  });

  const [newCollectiveMark, setNewCollectiveMark] = useState({
    aspect: '',
    coefficient: 1,
    maxScore: 10
  });

  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [showCollectiveForm, setShowCollectiveForm] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null);
  const [editingCollectiveIndex, setEditingCollectiveIndex] = useState(null);

  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        discipline: initialData.discipline || 'dressage',
        exercises: initialData.exercises || [],
        collectiveMarks: initialData.collectiveMarks || []
      });
    } else if (!isEditMode) {
      // Resetear formulario al cerrar
      setFormData({
        name: '',
        description: '',
        discipline: 'dressage',
        exercises: [],
        collectiveMarks: []
      });
    }
  }, [isEditMode, initialData, isOpen]);

  const handleAddExercise = () => {
    if (!newExercise.description.trim()) {
      alert('Por favor ingrese una descripción para el ejercicio');
      return;
    }

    if (editingExerciseIndex !== null) {
      // Editar ejercicio existente
      const updatedExercises = [...formData.exercises];
      updatedExercises[editingExerciseIndex] = newExercise;
      setFormData({ ...formData, exercises: updatedExercises });
      setEditingExerciseIndex(null);
    } else {
      // Agregar nuevo ejercicio
      setFormData({
        ...formData,
        exercises: [...formData.exercises, newExercise]
      });
    }

    // Resetear formulario
    setNewExercise({
      number: formData.exercises.length + 2,
      description: '',
      coefficient: 1,
      maxScore: 10
    });
    setShowExerciseForm(false);
  };

  const handleEditExercise = (index) => {
    setNewExercise(formData.exercises[index]);
    setEditingExerciseIndex(index);
    setShowExerciseForm(true);
  };

  const handleDeleteExercise = (index) => {
    if (confirm('¿Está seguro de eliminar este ejercicio?')) {
      const updatedExercises = formData.exercises.filter((_, i) => i !== index);
      // Renumerar ejercicios
      const renumberedExercises = updatedExercises.map((ex, i) => ({
        ...ex,
        number: i + 1
      }));
      setFormData({ ...formData, exercises: renumberedExercises });
    }
  };

  const handleAddCollectiveMark = () => {
    if (!newCollectiveMark.aspect.trim()) {
      alert('Por favor ingrese el aspecto a evaluar');
      return;
    }

    if (editingCollectiveIndex !== null) {
      // Editar nota de conjunto existente
      const updatedMarks = [...formData.collectiveMarks];
      updatedMarks[editingCollectiveIndex] = newCollectiveMark;
      setFormData({ ...formData, collectiveMarks: updatedMarks });
      setEditingCollectiveIndex(null);
    } else {
      // Agregar nueva nota de conjunto
      setFormData({
        ...formData,
        collectiveMarks: [...formData.collectiveMarks, newCollectiveMark]
      });
    }

    // Resetear formulario
    setNewCollectiveMark({
      aspect: '',
      coefficient: 1,
      maxScore: 10
    });
    setShowCollectiveForm(false);
  };

  const handleEditCollectiveMark = (index) => {
    setNewCollectiveMark(formData.collectiveMarks[index]);
    setEditingCollectiveIndex(index);
    setShowCollectiveForm(true);
  };

  const handleDeleteCollectiveMark = (index) => {
    if (confirm('¿Está seguro de eliminar esta nota de conjunto?')) {
      const updatedMarks = formData.collectiveMarks.filter((_, i) => i !== index);
      setFormData({ ...formData, collectiveMarks: updatedMarks });
    }
  };

  const calculateMaxScore = () => {
    let total = 0;
    formData.exercises.forEach(ex => {
      total += ex.maxScore * ex.coefficient;
    });
    formData.collectiveMarks.forEach(mark => {
      total += mark.maxScore * mark.coefficient;
    });
    return total;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Por favor ingrese un nombre para la plantilla');
      return;
    }

    if (formData.exercises.length === 0) {
      alert('Por favor agregue al menos un ejercicio');
      return;
    }

    const templateData = {
      ...formData,
      maxScore: calculateMaxScore()
    };

    onSubmit(templateData);

    // Resetear formulario
    setFormData({
      name: '',
      description: '',
      discipline: 'dressage',
      exercises: [],
      collectiveMarks: []
    });
  };

  const handleDownloadExcelTemplate = () => {
    downloadTemplateExcelExample();
    alert('✅ Plantilla Excel descargada!\n\n' +
          '1. Abre el archivo en Excel\n' +
          '2. Completa las hojas "Ejercicios" y "Notas de Conjunto"\n' +
          '3. Guarda el archivo\n' +
          '4. Usa el botón "Importar desde Excel" para cargarlo');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-t-lg z-10">
          <h2 className="text-2xl font-bold">
            {isEditMode ? 'Editar Plantilla' : 'Crear Nueva Plantilla de Calificación'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información General */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información General</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Plantilla *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: FUTUROS CAMPEONES - TABLA A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Disciplina *
                </label>
                <select
                  value={formData.discipline}
                  onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="dressage">Dressage</option>
                  <option value="jumping">Salto</option>
                  <option value="eventing">Concurso Completo</option>
                  <option value="endurance">Endurance</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="3"
                placeholder="Descripción de la plantilla y criterios de evaluación..."
              />
            </div>
          </div>

          {/* Sección de descarga de plantilla Excel */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <span className="text-3xl">📥</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  ¿Prefieres crear la plantilla en Excel?
                </h4>
                <p className="text-xs text-blue-700 mb-3">
                  Descarga nuestra plantilla con ejemplos, complétala en Excel
                  y luego impórtala usando el botón "Importar desde Excel" disponible
                  en la página de Gestión de Plantillas.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                >
                  <span>📥</span>
                  <span>Descargar Plantilla Excel de Ejemplo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ejercicios */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Ejercicios ({formData.exercises.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowExerciseForm(!showExerciseForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                {showExerciseForm ? 'Cancelar' : '+ Agregar Ejercicio'}
              </button>
            </div>

            {/* Formulario de nuevo ejercicio */}
            {showExerciseForm && (
              <div className="bg-white p-4 rounded-md mb-4 border-2 border-blue-300">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número
                    </label>
                    <input
                      type="number"
                      value={newExercise.number}
                      onChange={(e) => setNewExercise({ ...newExercise, number: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coeficiente
                    </label>
                    <input
                      type="number"
                      value={newExercise.coefficient}
                      onChange={(e) => setNewExercise({ ...newExercise, coefficient: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                      max="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puntuación Máxima
                    </label>
                    <input
                      type="number"
                      value={newExercise.maxScore}
                      onChange={(e) => setNewExercise({ ...newExercise, maxScore: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subtotal
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-center font-bold">
                      {newExercise.maxScore * newExercise.coefficient}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción del Ejercicio *
                  </label>
                  <textarea
                    value={newExercise.description}
                    onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="2"
                    placeholder="Ej: Entrada en paso trabajado. Alto e inmovilidad. Saludo"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddExercise}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    {editingExerciseIndex !== null ? 'Actualizar Ejercicio' : 'Agregar Ejercicio'}
                  </button>
                </div>
              </div>
            )}

            {/* Lista de ejercicios */}
            <div className="space-y-2">
              {formData.exercises.map((exercise, index) => (
                <div key={index} className="bg-white p-3 rounded-md flex justify-between items-start border border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-start space-x-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm">
                        {exercise.number}
                      </span>
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium">{exercise.description}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Coef. {exercise.coefficient} × Max {exercise.maxScore} = <span className="font-bold">{exercise.coefficient * exercise.maxScore} pts</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      type="button"
                      onClick={() => handleEditExercise(index)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteExercise(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas de Conjunto */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Notas de Conjunto ({formData.collectiveMarks.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowCollectiveForm(!showCollectiveForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                {showCollectiveForm ? 'Cancelar' : '+ Agregar Nota de Conjunto'}
              </button>
            </div>

            {/* Formulario de nueva nota de conjunto */}
            {showCollectiveForm && (
              <div className="bg-white p-4 rounded-md mb-4 border-2 border-green-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aspecto a Evaluar *
                    </label>
                    <input
                      type="text"
                      value={newCollectiveMark.aspect}
                      onChange={(e) => setNewCollectiveMark({ ...newCollectiveMark, aspect: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Ej: Aires (libertad y regularidad)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coeficiente
                    </label>
                    <input
                      type="number"
                      value={newCollectiveMark.coefficient}
                      onChange={(e) => setNewCollectiveMark({ ...newCollectiveMark, coefficient: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                      max="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puntuación Máxima
                    </label>
                    <input
                      type="number"
                      value={newCollectiveMark.maxScore}
                      onChange={(e) => setNewCollectiveMark({ ...newCollectiveMark, maxScore: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="1"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddCollectiveMark}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    {editingCollectiveIndex !== null ? 'Actualizar Nota' : 'Agregar Nota de Conjunto'}
                  </button>
                </div>
              </div>
            )}

            {/* Lista de notas de conjunto */}
            <div className="space-y-2">
              {formData.collectiveMarks.map((mark, index) => (
                <div key={index} className="bg-white p-3 rounded-md flex justify-between items-center border border-gray-200">
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{mark.aspect}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Coef. {mark.coefficient} × Max {mark.maxScore} = <span className="font-bold">{mark.coefficient * mark.maxScore} pts</span>
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      type="button"
                      onClick={() => handleEditCollectiveMark(index)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCollectiveMark(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border-2 border-purple-300">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">📊 Resumen de la Plantilla</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Ejercicios</p>
                <p className="text-2xl font-bold text-purple-900">{formData.exercises.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Notas de Conjunto</p>
                <p className="text-2xl font-bold text-purple-900">{formData.collectiveMarks.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Puntuación Máxima</p>
                <p className="text-2xl font-bold text-purple-900">{calculateMaxScore()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Disciplina</p>
                <p className="text-xl font-bold text-purple-900 capitalize">{formData.discipline}</p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium"
            >
              {isEditMode ? 'Actualizar Plantilla' : 'Crear Plantilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTemplateModal;
