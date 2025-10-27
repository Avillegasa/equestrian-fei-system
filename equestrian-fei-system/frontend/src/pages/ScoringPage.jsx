import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ScoreParticipantModal from '../components/ScoreParticipantModal';
import DressageScoreModal from '../components/scoring/DressageScoreModal';
import MultiJudgePanel from '../components/MultiJudgePanel';
import ImportExcelModal from '../components/ImportExcelModal';
import { exportCompetitionScores, exportBlankScoringTemplate } from '../services/excelService';

const ScoringPage = () => {
  const { competitionId } = useParams();
  const { user, logout } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [scores, setScores] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [myAssignment, setMyAssignment] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Estado para disciplina y tipo de calificación
  const [discipline, setDiscipline] = useState('dressage'); // 'dressage' o 'show_jumping'
  const [dressageTemplate, setDressageTemplate] = useState('futuros_campeones_a');

  // Estado para vista de calificación
  const [viewMode, setViewMode] = useState('individual'); // 'individual' o 'multi_judge'

  // Estado para importación/exportación
  const [showImportModal, setShowImportModal] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);

  const handleLogout = async () => {
    await logout();
  };

  // Cargar plantillas personalizadas desde localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('fei_custom_templates');
    if (savedTemplates) {
      try {
        setCustomTemplates(JSON.parse(savedTemplates));
      } catch (error) {
        console.error('Error al cargar plantillas personalizadas:', error);
      }
    }
  }, []);

  // Manejar importación de tabla de Excel
  const handleImportTemplate = (template) => {
    console.log('📤 Plantilla importada:', template);

    // Agregar a plantillas personalizadas
    const updatedTemplates = [...customTemplates, template];
    setCustomTemplates(updatedTemplates);

    // Guardar en localStorage
    localStorage.setItem('fei_custom_templates', JSON.stringify(updatedTemplates));

    // Seleccionar automáticamente la plantilla importada
    setDressageTemplate(template.id);

    alert(`✅ Plantilla "${template.name}" importada exitosamente!\n\n` +
          `Ejercicios: ${template.exercises.length}\n` +
          `Notas de Conjunto: ${template.collectiveMarks.length}\n` +
          `Puntuación Máxima: ${template.maxScore}`);
  };

  // Exportar resultados completos de la competencia
  const handleExportResults = () => {
    try {
      // Cargar jueces desde localStorage
      const storageKey = `fei_staff_${competitionId}`;
      const savedStaff = localStorage.getItem(storageKey);
      const judges = savedStaff ? JSON.parse(savedStaff).filter(s =>
        s.role === 'judge' || s.role === 'chief_judge'
      ) : [];

      const fileName = exportCompetitionScores(competition, participants, scores, judges);
      alert(`✅ Resultados exportados exitosamente!\n\nArchivo: ${fileName}`);
    } catch (error) {
      console.error('Error al exportar resultados:', error);
      alert('❌ Error al exportar resultados. Verifica la consola para más detalles.');
    }
  };

  // Exportar plantilla vacía para un participante
  const handleExportBlankTemplate = (participant) => {
    try {
      // Obtener la plantilla actual (puede ser personalizada o predeterminada)
      const template = customTemplates.find(t => t.id === dressageTemplate) || {
        id: 'futuros_campeones_a',
        name: 'FUTUROS CAMPEONES - TABLA A',
        exercises: [],
        collectiveMarks: [],
        maxScore: 160
      };

      const fileName = exportBlankScoringTemplate(template, participant);
      alert(`✅ Plantilla exportada exitosamente!\n\nArchivo: ${fileName}`);
    } catch (error) {
      console.error('Error al exportar plantilla:', error);
      alert('❌ Error al exportar plantilla. Verifica la consola para más detalles.');
    }
  };

  // Verificar asignación del juez a esta competencia
  useEffect(() => {
    if (!user || !competitionId) return;

    const storageKey = `fei_staff_${competitionId}`;
    const savedStaff = localStorage.getItem(storageKey);

    if (savedStaff) {
      try {
        const staff = JSON.parse(savedStaff);
        const assignment = staff.find(
          s => s.staff_member.email === user.email || s.staff_member.id === user.id
        );

        if (assignment) {
          console.log('📋 Asignación encontrada:', assignment);
          setMyAssignment(assignment);
          setIsConfirmed(assignment.is_confirmed);
        } else {
          console.log('⚠️ No estás asignado a esta competencia');
        }
      } catch (error) {
        console.error('Error al cargar asignación:', error);
      }
    }
  }, [user, competitionId]);

  // Aceptar asignación
  const handleAcceptAssignment = () => {
    const storageKey = `fei_staff_${competitionId}`;
    const savedStaff = localStorage.getItem(storageKey);

    if (savedStaff) {
      try {
        const staff = JSON.parse(savedStaff);
        const updatedStaff = staff.map(s => {
          if (s.id === myAssignment.id) {
            return { ...s, is_confirmed: true };
          }
          return s;
        });

        localStorage.setItem(storageKey, JSON.stringify(updatedStaff));
        setMyAssignment({ ...myAssignment, is_confirmed: true });
        setIsConfirmed(true);
        alert('✅ Has aceptado la asignación a la competencia!');
      } catch (error) {
        console.error('Error al aceptar asignación:', error);
        alert('❌ Error al aceptar la asignación');
      }
    }
  };

  // Rechazar asignación
  const handleRejectAssignment = () => {
    if (!window.confirm('¿Estás seguro de que quieres rechazar esta asignación? No podrás calificar en esta competencia.')) {
      return;
    }

    const storageKey = `fei_staff_${competitionId}`;
    const savedStaff = localStorage.getItem(storageKey);

    if (savedStaff) {
      try {
        const staff = JSON.parse(savedStaff);
        const updatedStaff = staff.filter(s => s.id !== myAssignment.id);

        localStorage.setItem(storageKey, JSON.stringify(updatedStaff));
        alert('❌ Has rechazado la asignación. Serás redirigido al dashboard.');
        window.location.href = '/judge';
      } catch (error) {
        console.error('Error al rechazar asignación:', error);
        alert('❌ Error al rechazar la asignación');
      }
    }
  };

  // Datos de ejemplo para demostración
  useEffect(() => {
    console.log('🎯 ScoringPage montada, competitionId:', competitionId);

    // Simular carga de datos
    setTimeout(() => {
      const compId = competitionId || '1';
      console.log('✅ Cargando competencia:', compId);

      // Cargar disciplina desde localStorage si existe
      const savedDiscipline = localStorage.getItem(`fei_competition_${compId}_discipline`) || 'dressage';

      setCompetition({
        id: compId,
        name: 'Copa Internacional de Salto 2024',
        discipline: savedDiscipline === 'show_jumping' ? 'Show Jumping' : 'Dressage',
        location: 'Madrid, España',
        startDate: '2025-10-03',
        endDate: '2025-10-06',
        status: 'in_progress'
      });

      setDiscipline(savedDiscipline);

      setParticipants([
        {
          id: 1,
          rider: { first_name: 'María', last_name: 'González' },
          horse: { name: 'Thunder' },
          category: 'Juvenil 1.20m',
          bib_number: 1,
          order: 1
        },
        {
          id: 2,
          rider: { first_name: 'Ana', last_name: 'Martín' },
          horse: { name: 'Lightning' },
          category: 'Senior 1.40m',
          bib_number: 2,
          order: 2
        },
        {
          id: 3,
          rider: { first_name: 'Carlos', last_name: 'Rodríguez' },
          horse: { name: 'Storm' },
          category: 'Juvenil 1.20m',
          bib_number: 3,
          order: 3
        }
      ]);

      setScores([
        {
          id: 1,
          participant_id: 1,
          judge_id: user?.id || 1,
          judge_name: user?.first_name + ' ' + user?.last_name || 'Juez Principal',
          time_seconds: 65.50,
          faults: 0,
          time_faults: 0,
          refusals: 0,
          final_score: 0,
          status: 'completed',
          created_at: '2024-10-03T09:15:00'
        }
      ]);

      setLoading(false);
    }, 500);
  }, [competitionId, user]);

  const handleScoreParticipant = (participantId) => {
    const participant = participants.find(p => p.id === participantId);
    setSelectedParticipant(participant);
    setShowScoreModal(true);
  };

  const handleSubmitScore = (scoreData) => {
    let newScore;

    if (discipline === 'dressage') {
      // Calificación de Adiestramiento
      newScore = {
        id: scores.length + 1,
        participant_id: selectedParticipant.id,
        judge_id: user?.id || 1,
        judge_name: user?.first_name + ' ' + user?.last_name || 'Juez Principal',
        judge_position: scoreData.judgePosition || 'C',
        discipline: 'dressage',
        template: scoreData.template,
        exercises: scoreData.exercises,
        collectiveMarks: scoreData.collectiveMarks,
        exercisesSubtotal: scoreData.exercisesSubtotal,
        collectiveSubtotal: scoreData.collectiveSubtotal,
        totalScore: scoreData.totalScore,
        percentage: scoreData.percentage,
        maxScore: scoreData.maxScore,
        comments: scoreData.comments || '',
        status: 'completed',
        created_at: new Date().toISOString()
      };
    } else {
      // Calificación de Salto (Show Jumping)
      const finalScore = scoreData.faults + scoreData.time_faults + (scoreData.refusals * 4);

      newScore = {
        id: scores.length + 1,
        participant_id: selectedParticipant.id,
        judge_id: user?.id || 1,
        judge_name: user?.first_name + ' ' + user?.last_name || 'Juez Principal',
        discipline: 'show_jumping',
        time_seconds: parseFloat(scoreData.time_seconds),
        faults: parseInt(scoreData.faults),
        time_faults: parseFloat(scoreData.time_faults),
        refusals: parseInt(scoreData.refusals),
        final_score: finalScore,
        status: 'completed',
        notes: scoreData.notes || '',
        created_at: new Date().toISOString()
      };
    }

    setScores(prev => [...prev, newScore]);

    // Guardar en localStorage
    const storageKey = `fei_scores_${competitionId}`;
    const updatedScores = [...scores, newScore];
    localStorage.setItem(storageKey, JSON.stringify(updatedScores));

    console.log('💾 Calificación guardada:', newScore);
    alert(`✅ Puntuación ${discipline === 'dressage' ? 'de Adiestramiento' : 'de Salto'} registrada exitosamente!`);
  };

  const getParticipantScore = (participantId) => {
    return scores.find(s => s.participant_id === participantId);
  };

  const getStatusColor = (participantId) => {
    const score = getParticipantScore(participantId);
    if (!score) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (participantId) => {
    const score = getParticipantScore(participantId);
    if (!score) return 'Pendiente';
    return 'Calificado';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema de calificación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link to="/judge" className="text-blue-600 hover:text-blue-500 mr-4">
                ← Volver al Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                ⚖️ Sistema de Calificación
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Juez: {user?.first_name || 'Usuario'} {user?.last_name || ''}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Banner de Confirmación Pendiente */}
          {myAssignment && !isConfirmed && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="text-3xl mr-4">⏳</div>
                  <div>
                    <h3 className="text-lg font-bold text-yellow-900">
                      Confirmación de Asignación Pendiente
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Has sido asignado como{' '}
                      <span className="font-semibold">
                        {myAssignment.role === 'judge' && 'Juez'}
                        {myAssignment.role === 'chief_judge' && 'Juez Principal'}
                        {myAssignment.role === 'observer' && 'Observador'}
                      </span>{' '}
                      para esta competencia. Por favor, confirma tu participación.
                    </p>
                    {myAssignment.notes && (
                      <p className="text-sm text-yellow-700 mt-2">
                        <span className="font-medium">Notas del organizador:</span> {myAssignment.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleRejectAssignment}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                  >
                    <span>❌</span>
                    <span>Rechazar</span>
                  </button>
                  <button
                    onClick={handleAcceptAssignment}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                  >
                    <span>✅</span>
                    <span>Aceptar Asignación</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Banner de Confirmación Exitosa */}
          {myAssignment && isConfirmed && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-8">
              <div className="flex items-center">
                <div className="text-2xl mr-3">✅</div>
                <div>
                  <h3 className="text-sm font-bold text-green-900">
                    Asignación Confirmada
                  </h3>
                  <p className="text-xs text-green-700">
                    Has confirmado tu participación como{' '}
                    {myAssignment.role === 'judge' && 'Juez'}
                    {myAssignment.role === 'chief_judge' && 'Juez Principal'}
                    {myAssignment.role === 'observer' && 'Observador'} en esta competencia.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Competition Info */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{competition.name}</h2>
                  <p className="text-sm text-gray-500">
                    {competition.discipline} • {competition.location}
                  </p>
                  <p className="text-sm text-gray-500">
                    {competition.startDate} - {competition.endDate}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    🔴 En Vivo
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuración de Disciplina */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selector de Disciplina */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📋 Disciplina
                </label>
                <select
                  value={discipline}
                  onChange={(e) => {
                    const newDiscipline = e.target.value;
                    setDiscipline(newDiscipline);
                    localStorage.setItem(`fei_competition_${competitionId}_discipline`, newDiscipline);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium"
                >
                  <option value="dressage">🎯 Adiestramiento / Dressage</option>
                  <option value="show_jumping">🏇 Salto / Show Jumping</option>
                </select>
              </div>

              {/* Selector de Template (solo para Dressage) */}
              {discipline === 'dressage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📄 Tabla de Cómputos
                  </label>
                  <select
                    value={dressageTemplate}
                    onChange={(e) => setDressageTemplate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white font-medium"
                  >
                    <option value="futuros_campeones_a">Futuros Campeones - Tabla A</option>
                    <option value="young_riders">Young Riders - Prix St George</option>
                    {customTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} (Importada)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-3 text-xs text-gray-600">
              {discipline === 'dressage' ? (
                <p>⚠️ Modo Adiestramiento: Calificación por ejercicios (0-10) con coeficientes y notas de conjunto</p>
              ) : (
                <p>⚠️ Modo Salto: Calificación por tiempo, faltas y rechazos</p>
              )}
            </div>
          </div>

          {/* Excel Import/Export (Solo Admin/Organizer) */}
          {(user?.role === 'admin' || user?.role === 'organizer') && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Gestión de Excel
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Importar Tabla */}
                {discipline === 'dressage' && (
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="flex items-center justify-center space-x-2 bg-white hover:bg-green-50 border-2 border-green-300 text-green-700 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  >
                    <span className="text-xl">📤</span>
                    <span>Importar Tabla de Cómputos (.xlsx)</span>
                  </button>
                )}

                {/* Exportar Resultados */}
                <button
                  onClick={handleExportResults}
                  disabled={scores.length === 0}
                  className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    scores.length > 0
                      ? 'bg-white hover:bg-blue-50 border-2 border-blue-300 text-blue-700 hover:shadow-md'
                      : 'bg-gray-200 border-2 border-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span className="text-xl">📥</span>
                  <span>Exportar Resultados Completos (.xlsx)</span>
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-600">
                <p>💡 <strong>Importar:</strong> Sube tus tablas de cómputos oficiales en Excel para usarlas en las calificaciones</p>
                <p>💡 <strong>Exportar:</strong> Descarga todos los resultados con rankings, promedios y detalles por juez</p>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🏇</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Participantes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {participants.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Calificados
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {scores.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pendientes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {participants.length - scores.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Progreso
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Math.round((scores.length / participants.length) * 100)}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* View Mode Toggle (Solo para Admin/Organizer) */}
          {(user?.role === 'admin' || user?.role === 'organizer') && (
            <div className="bg-white shadow rounded-lg p-4 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Vista de Calificación</h3>
                  <p className="text-sm text-gray-600">Selecciona cómo deseas ver las calificaciones</p>
                </div>
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('individual')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === 'individual'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    👤 Vista Individual
                  </button>
                  <button
                    onClick={() => setViewMode('multi_judge')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === 'multi_judge'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    👥 Panel Multi-Juez
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Panel Multi-Juez (Solo para Admin/Organizer) */}
          {viewMode === 'multi_judge' && (user?.role === 'admin' || user?.role === 'organizer') && (
            <MultiJudgePanel
              competitionId={competitionId}
              participants={participants}
            />
          )}

          {/* Vista Individual de Participantes */}
          {viewMode === 'individual' && (
            <>
              {/* Participants List */}
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Orden de Participación
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Participantes en orden de salida - FEI Show Jumping Rules
                  </p>
                </div>

            {loading ? (
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Cargando participantes...</p>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {participants.map((participant) => {
                  const score = getParticipantScore(participant.id);
                  return (
                    <li key={participant.id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="bg-blue-100 rounded-full h-12 w-12 flex items-center justify-center">
                                <span className="text-blue-600 font-bold">#{participant.bib_number}</span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-gray-900">
                                  {participant.rider.first_name} {participant.rider.last_name} + {participant.horse.name}
                                </div>
                                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(participant.id)}`}>
                                  {getStatusText(participant.id)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                Categoría: {participant.category} • Orden: {participant.order}
                              </div>
                              {score && (
                                <div className="text-sm text-gray-600 mt-1">
                                  <div className="grid grid-cols-4 gap-4">
                                    <span>⏱️ Tiempo: {formatTime(score.time_seconds)}</span>
                                    <span>❌ Faltas: {score.faults}</span>
                                    <span>⏰ Tiempo: {score.time_faults}</span>
                                    <span>🚫 Rehusos: {score.refusals}</span>
                                  </div>
                                  <div className="mt-1">
                                    <span className="font-semibold">Puntuación Final: {score.final_score} puntos</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            {score && (
                              <div className="text-right text-sm text-gray-500">
                                Calificado: {new Date(score.created_at).toLocaleTimeString('es-ES')}
                              </div>
                            )}
                            <div className="flex space-x-2">
                              {!score ? (
                                <button
                                  onClick={() => handleScoreParticipant(participant.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                >
                                  Calificar
                                </button>
                              ) : (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleScoreParticipant(participant.id)}
                                    className="text-yellow-600 hover:text-yellow-500 text-sm font-medium"
                                  >
                                    Editar
                                  </button>
                                  <span className="text-green-600 text-sm font-medium">
                                    ✅ Completado
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

              {/* Reglas FEI */}
              <div className="mt-8 bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  📖 Reglas FEI de Puntuación - Salto Ecuestre
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>
                    <h4 className="font-semibold mb-2">Penalizaciones por Faltas:</h4>
                    <ul className="space-y-1">
                      <li>• Derribo de obstáculo: 4 puntos</li>
                      <li>• Primera desobediencia: 4 puntos</li>
                      <li>• Segunda desobediencia: Eliminación</li>
                      <li>• Caída del jinete: Eliminación</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Penalizaciones por Tiempo:</h4>
                    <ul className="space-y-1">
                      <li>• Cada segundo excedido: 1 punto</li>
                      <li>• Tiempo máximo: 2x tiempo permitido</li>
                      <li>• Menor puntuación = mejor resultado</li>
                      <li>• En caso de empate: tiempo menor gana</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Modal de Calificación - Renderizado Condicional según Disciplina */}
          {discipline === 'dressage' ? (
            <DressageScoreModal
              isOpen={showScoreModal}
              onClose={() => setShowScoreModal(false)}
              onSubmit={handleSubmitScore}
              participant={selectedParticipant}
              existingScore={selectedParticipant ? getParticipantScore(selectedParticipant.id) : null}
              template={dressageTemplate}
              judgePosition={myAssignment?.role === 'chief_judge' ? 'C' : 'B'}
            />
          ) : (
            <ScoreParticipantModal
              isOpen={showScoreModal}
              onClose={() => setShowScoreModal(false)}
              onSubmit={handleSubmitScore}
              participant={selectedParticipant}
              existingScore={selectedParticipant ? getParticipantScore(selectedParticipant.id) : null}
            />
          )}

          {/* Modal de Importación de Excel */}
          <ImportExcelModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={handleImportTemplate}
          />
        </div>
      </main>
    </div>
  );
};

export default ScoringPage;