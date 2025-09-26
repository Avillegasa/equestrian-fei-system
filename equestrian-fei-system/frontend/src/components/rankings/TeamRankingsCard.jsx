import { useState } from 'react';
import useRankingStore from '../../store/rankingStore';

const TeamRankingsCard = ({ teamRankings, loading, competitionId }) => {
  const [expandedTeam, setExpandedTeam] = useState(null);

  const { updateAllTeams } = useRankingStore();

  const handleUpdateAllTeams = async () => {
    try {
      await updateAllTeams(competitionId);
    } catch (error) {
      console.error('Error updating teams:', error);
    }
  };

  const toggleTeamExpansion = (teamId) => {
    setExpandedTeam(expandedTeam === teamId ? null : teamId);
  };

  const getPositionIcon = (position) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${position}°`;
    }
  };

  const formatScore = (score) => {
    return parseFloat(score || 0).toFixed(2);
  };

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return '🏳️';

    // Simple country code to flag emoji mapping
    const flags = {
      'ARG': '🇦🇷', 'BRA': '🇧🇷', 'CHL': '🇨🇱', 'COL': '🇨🇴',
      'ESP': '🇪🇸', 'FRA': '🇫🇷', 'GER': '🇩🇪', 'GBR': '🇬🇧',
      'ITA': '🇮🇹', 'MEX': '🇲🇽', 'NED': '🇳🇱', 'POR': '🇵🇹',
      'USA': '🇺🇸', 'URY': '🇺🇾', 'VEN': '🇻🇪'
    };

    return flags[countryCode?.toUpperCase()] || '🏳️';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Rankings por Equipos
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {teamRankings.length} equipos participando
            </p>
          </div>

          <button
            onClick={handleUpdateAllTeams}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            🔄 Actualizar Equipos
          </button>
        </div>
      </div>

      {/* Team Rankings */}
      {teamRankings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl text-gray-300 mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay equipos registrados
          </h3>
          <p className="text-gray-500">
            Los equipos aparecerán aquí cuando los participantes se registren con equipos.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {teamRankings.map((team, index) => (
            <div
              key={team.id}
              className={`p-6 hover:bg-gray-50 transition-colors ${
                team.position <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : ''
              }`}
            >
              {/* Team Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold text-gray-700">
                    {getPositionIcon(team.position)}
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {getCountryFlag(team.country_code)}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {team.team_name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>👥 {team.members_count} miembros</span>
                        <span>✅ {team.qualified_members} clasificados</span>
                        <span>#{team.team_code}</span>
                        {team.is_qualified && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            Clasificado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatScore(team.total_score)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Promedio: {formatScore(team.average_score)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Mejor: {formatScore(team.best_individual_score)}
                  </div>
                </div>
              </div>

              {/* Team Members Toggle */}
              {team.team_members && team.team_members.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => toggleTeamExpansion(team.id)}
                    className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <span>
                      {expandedTeam === team.id ? '▼' : '▶'}
                    </span>
                    <span>
                      {expandedTeam === team.id ? 'Ocultar' : 'Ver'} miembros del equipo
                    </span>
                  </button>

                  {/* Expanded Team Members */}
                  {expandedTeam === team.id && (
                    <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900">
                          Miembros del Equipo {team.team_name}
                        </h4>
                      </div>

                      <div className="divide-y divide-gray-200">
                        {team.team_members.map((member, memberIndex) => (
                          <div key={member.id} className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="text-sm font-medium text-gray-900">
                                {member.rider_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {member.horse_name}
                              </div>
                              <div className="text-xs text-gray-400">
                                #{member.number}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-semibold text-gray-900">
                                {formatScore(member.best_score)}
                              </div>
                              <div className="text-xs text-gray-500">
                                Mejor puntuación
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Team Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                  <span>Progreso del equipo</span>
                  <span>{team.qualified_members}/{team.members_count} clasificados</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      team.qualified_members === team.members_count
                        ? 'bg-green-500'
                        : team.qualified_members > team.members_count / 2
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{
                      width: `${team.members_count > 0 ? (team.qualified_members / team.members_count) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            Puntuación basada en los mejores 3 resultados por equipo
          </div>
          <div>
            Última actualización: {new Date().toLocaleTimeString('es-ES')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamRankingsCard;