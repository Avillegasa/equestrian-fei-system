const TemplateCard = ({ template, onEdit, onDelete, readOnly = false }) => {
  const getDisciplineIcon = (discipline) => {
    const icons = {
      dressage: '🎭',
      jumping: '🏇',
      eventing: '🏆',
      endurance: '⏱️'
    };
    return icons[discipline] || '📋';
  };

  const getDisciplineLabel = (discipline) => {
    const labels = {
      dressage: 'Dressage',
      jumping: 'Salto',
      eventing: 'Concurso Completo',
      endurance: 'Endurance'
    };
    return labels[discipline] || discipline;
  };

  const calculateMaxScore = () => {
    let total = 0;
    (template.exercises || []).forEach(ex => {
      total += (ex.maxScore || 0) * (ex.coefficient || 1);
    });
    (template.collectiveMarks || []).forEach(mark => {
      total += (mark.maxScore || 0) * (mark.coefficient || 1);
    });
    return total;
  };

  const handleDelete = () => {
    if (confirm(`¿Está seguro de eliminar la plantilla "${template.name}"?\n\nEsta acción no se puede deshacer.`)) {
      onDelete(template.id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
      {/* Header */}
      <div className={`px-6 py-4 ${template.is_system ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-purple-500 to-purple-600'}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-2xl">{getDisciplineIcon(template.discipline)}</span>
              <h3 className="text-xl font-bold text-white">{template.name}</h3>
            </div>
            <p className="text-blue-50 text-sm">
              {getDisciplineLabel(template.discipline)}
            </p>
          </div>
          {template.is_system && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
              🔒 Sistema
            </span>
          )}
          {!template.is_system && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
              ✨ Personalizada
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Descripción */}
        {template.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Ejercicios</p>
            <p className="text-2xl font-bold text-blue-600">
              {(template.exercises || []).length}
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Notas Conjunto</p>
            <p className="text-2xl font-bold text-green-600">
              {(template.collectiveMarks || []).length}
            </p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Puntaje Máx</p>
            <p className="text-2xl font-bold text-purple-600">
              {template.maxScore || calculateMaxScore()}
            </p>
          </div>
        </div>

        {/* Vista Previa de Ejercicios */}
        {(template.exercises || []).length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Vista Previa
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto bg-gray-50 p-3 rounded-md">
              {template.exercises.slice(0, 5).map((exercise, index) => (
                <div key={index} className="flex items-start space-x-2 text-xs">
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-500 text-white rounded-full font-bold flex-shrink-0" style={{ fontSize: '10px' }}>
                    {exercise.number}
                  </span>
                  <p className="text-gray-700 line-clamp-1 flex-1">{exercise.description}</p>
                  <span className="text-gray-500 flex-shrink-0">
                    {exercise.coefficient}×{exercise.maxScore}
                  </span>
                </div>
              ))}
              {template.exercises.length > 5 && (
                <p className="text-xs text-gray-500 italic text-center pt-1">
                  +{template.exercises.length - 5} ejercicios más...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 border-t pt-3">
          {template.created_at && (
            <p>
              Creada: {new Date(template.created_at).toLocaleDateString()}
            </p>
          )}
          {template.updated_at && (
            <p>
              Actualizada: {new Date(template.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Footer / Actions */}
      {!readOnly && !template.is_system && (
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
          {onEdit && (
            <button
              onClick={() => onEdit(template)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              ✏️ Editar
            </button>
          )}
          {onDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
            >
              🗑️ Eliminar
            </button>
          )}
        </div>
      )}

      {readOnly && template.is_system && (
        <div className="px-6 py-3 bg-blue-50 border-t">
          <p className="text-xs text-blue-700 text-center italic">
            🔒 Plantilla del sistema FEI - Solo lectura
          </p>
        </div>
      )}
    </div>
  );
};

export default TemplateCard;
