import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import RegisterParticipantModal from '../components/RegisterParticipantModal';

const ParticipantsPage = () => {
  const { competitionId } = useParams();
  const { user, logout } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  // Datos de ejemplo para demostración
  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setCompetition({
        id: competitionId || 1,
        name: 'Copa Internacional de Salto 2024',
        discipline: 'Show Jumping',
        location: 'Madrid, España',
        startDate: '2025-10-03',
        endDate: '2025-10-06',
        status: 'open_registration'
      });

      setParticipants([
        {
          id: 1,
          rider: {
            first_name: 'María',
            last_name: 'González',
            email: 'maria.gonzalez@example.com',
            nationality: 'ESP'
          },
          horse: {
            name: 'Thunder',
            registration_number: 'ESP001',
            breed: 'Pura Sangre Español',
            age: 8,
            height: 165
          },
          category: 'Juvenil 1.20m',
          bib_number: 1,
          is_confirmed: true,
          is_paid: true,
          registration_date: '2024-09-15',
          emergency_contact_name: 'Carlos González',
          emergency_contact_phone: '+34 600 123 456'
        },
        {
          id: 2,
          rider: {
            first_name: 'Ana',
            last_name: 'Martín',
            email: 'ana.martin@example.com',
            nationality: 'ESP'
          },
          horse: {
            name: 'Lightning',
            registration_number: 'ESP002',
            breed: 'Hannoveriano',
            age: 10,
            height: 170
          },
          category: 'Senior 1.40m',
          bib_number: 2,
          is_confirmed: true,
          is_paid: false,
          registration_date: '2024-09-16',
          emergency_contact_name: 'Luis Martín',
          emergency_contact_phone: '+34 600 654 321'
        },
        {
          id: 3,
          rider: {
            first_name: 'Carlos',
            last_name: 'Rodríguez',
            email: 'carlos.rodriguez@example.com',
            nationality: 'ESP'
          },
          horse: {
            name: 'Storm',
            registration_number: 'ESP003',
            breed: 'KWPN',
            age: 9,
            height: 168
          },
          category: 'Juvenil 1.20m',
          bib_number: 3,
          is_confirmed: false,
          is_paid: false,
          registration_date: '2024-09-17',
          emergency_contact_name: 'Elena Rodríguez',
          emergency_contact_phone: '+34 600 789 123'
        }
      ]);
      setLoading(false);
    }, 500);
  }, [competitionId]);

  const handleRegisterParticipant = (participantData) => {
    // Generar un ID temporal y número de dorsal
    const newParticipant = {
      id: participants.length + 1,
      rider: {
        first_name: participantData.rider_first_name,
        last_name: participantData.rider_last_name,
        email: participantData.rider_email,
        nationality: participantData.rider_nationality
      },
      horse: {
        name: participantData.horse_name,
        registration_number: participantData.horse_registration,
        breed: participantData.horse_breed,
        age: parseInt(participantData.horse_age),
        height: parseInt(participantData.horse_height)
      },
      category: participantData.category,
      bib_number: participants.length + 1,
      is_confirmed: false,
      is_paid: false,
      registration_date: new Date().toISOString().split('T')[0],
      emergency_contact_name: participantData.emergency_contact_name,
      emergency_contact_phone: participantData.emergency_contact_phone
    };

    // Agregar el nuevo participante al estado
    setParticipants(prev => [newParticipant, ...prev]);

    // Mostrar mensaje de éxito
    alert('✅ Participante registrado exitosamente!');
  };

  const handleConfirmParticipant = (participantId) => {
    setParticipants(prev =>
      prev.map(p =>
        p.id === participantId ? { ...p, is_confirmed: true } : p
      )
    );
    alert('✅ Participante confirmado!');
  };

  const handleMarkPaid = (participantId) => {
    setParticipants(prev =>
      prev.map(p =>
        p.id === participantId ? { ...p, is_paid: true } : p
      )
    );
    alert('✅ Pago registrado!');
  };

  const handleRemoveParticipant = (participantId) => {
    if (window.confirm('¿Estás seguro de que deseas quitar a este participante?')) {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
      alert('✅ Participante removido!');
    }
  };

  const getStatusColor = (participant) => {
    if (participant.is_confirmed && participant.is_paid) {
      return 'bg-green-100 text-green-800';
    } else if (participant.is_confirmed) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  const getStatusText = (participant) => {
    if (participant.is_confirmed && participant.is_paid) {
      return 'Completo';
    } else if (participant.is_confirmed) {
      return 'Pendiente Pago';
    } else {
      return 'Pendiente Confirmación';
    }
  };

  if (!competition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
              <Link to="/admin/competitions" className="text-blue-600 hover:text-blue-500 mr-4">
                ← Volver a Competencias
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                🏇 Participantes de la Competencia
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Hola, {user?.first_name || 'Administrador'}
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
                    {competition.status === 'open_registration' ? 'Inscripción Abierta' : competition.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

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
                        Confirmados
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {participants.filter(p => p.is_confirmed).length}
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
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pagados
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {participants.filter(p => p.is_paid).length}
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
                        {participants.filter(p => !p.is_confirmed || !p.is_paid).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Participants Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Lista de Participantes
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Jinetes y caballos registrados en la competencia
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
                {participants.map((participant) => (
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
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(participant)}`}>
                                {getStatusText(participant)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Categoría: {participant.category}
                            </div>
                            <div className="text-sm text-gray-500">
                              Caballo: {participant.horse.breed}, {participant.horse.age} años, {participant.horse.height}cm
                            </div>
                            <div className="text-sm text-gray-500">
                              Email: {participant.rider.email} • Nacionalidad: {participant.rider.nationality}
                            </div>
                            <div className="text-sm text-gray-500">
                              Contacto emergencia: {participant.emergency_contact_name} ({participant.emergency_contact_phone})
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <div className="text-right text-sm text-gray-500">
                            Registrado: {participant.registration_date}
                          </div>
                          <div className="flex space-x-2">
                            {!participant.is_confirmed && (
                              <button
                                onClick={() => handleConfirmParticipant(participant.id)}
                                className="text-green-600 hover:text-green-500 text-sm font-medium"
                              >
                                Confirmar
                              </button>
                            )}
                            {!participant.is_paid && (
                              <button
                                onClick={() => handleMarkPaid(participant.id)}
                                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                              >
                                Marcar Pagado
                              </button>
                            )}
                            <button className="text-yellow-600 hover:text-yellow-500 text-sm font-medium">
                              Editar
                            </button>
                            <button
                              onClick={() => handleRemoveParticipant(participant.id)}
                              className="text-red-600 hover:text-red-500 text-sm font-medium"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              + Registrar Participante
            </button>
            <div className="flex space-x-2">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Generar Dorsales
              </button>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Lista de Salida
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                Exportar Lista
              </button>
            </div>
          </div>

          {/* Modal de Registrar Participante */}
          <RegisterParticipantModal
            isOpen={showRegisterModal}
            onClose={() => setShowRegisterModal(false)}
            onSubmit={handleRegisterParticipant}
          />
        </div>
      </main>
    </div>
  );
};

export default ParticipantsPage;