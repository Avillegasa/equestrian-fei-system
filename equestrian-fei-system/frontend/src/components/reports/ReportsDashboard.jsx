import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import axios from 'axios';

const ReportsDashboard = () => {
  const { user, isAdmin, isJudge } = useAuth();
  const [availableReports, setAvailableReports] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportStats, setReportStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchAvailableReports(),
        fetchCompetitions(),
        isAdmin ? fetchReportStats() : Promise.resolve()
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [user, isAdmin]);

  const fetchAvailableReports = async () => {
    try {
      const response = await axios.get('/api/reports/available_reports/');
      setAvailableReports(response.data.available_reports || []);
    } catch (error) {
      console.error('Error fetching available reports:', error);
      setAvailableReports([]); // Ensure state remains an array on error
    }
  };

  const fetchCompetitions = async () => {
    try {
      const response = await axios.get('/api/competitions/competitions/');
      setCompetitions(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching competitions:', error);
      setCompetitions([]); // Ensure state remains an array on error
    }
  };

  const fetchReportStats = async () => {
    try {
      const response = await axios.get('/api/reports/stats/usage_stats/');
      setReportStats(response.data);
    } catch (error) {
      console.error('Error fetching report stats:', error);
      setReportStats(null); // Ensure state remains null on error (already handled by conditional rendering)
    }
  };

  const generateReport = async (reportType, format = 'pdf') => {
    if (!selectedCompetition && reportType !== 'analytics_report') {
      alert('Por favor selecciona una competencia');
      return;
    }

    setIsGenerating(true);
    
    try {
      let url = `/api/reports/${reportType}/`;
      let params = { format };
      
      if (reportType === 'competition_results') {
        params.competition_id = selectedCompetition;
      } else if (reportType === 'judge_report') {
        params.competition_id = selectedCompetition;
        params.judge_id = user.id;
      }

      const response = await axios.get(url, {
        params,
        responseType: 'blob'
      });

      // Crear enlace de descarga
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const extension = format === 'excel' ? 'xlsx' : 'pdf';
      link.download = `${reportType}_${selectedCompetition || 'analytics'}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar reporte: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsGenerating(false);
    }
  };

  const ReportCard = ({ report }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {report.name}
      </h3>
      <p className="text-gray-600 mb-4">
        {report.description}
      </p>
      <div className="flex flex-wrap gap-2">
        {(report.formats || []).map(format => (
          <button
            key={format}
            onClick={() => generateReport(report.endpoint.split('/').pop(), format)}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isGenerating
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isGenerating ? 'Generando...' : `Descargar ${format.toUpperCase()}`}
          </button>
        ))}
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Dashboard de Reportes FEI
          </h1>
          <p className="text-gray-600">
            Genera reportes oficiales para competencias ecuestres
          </p>
        </div>

        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Cargando reportes disponibles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Dashboard de Reportes FEI
        </h1>
        <p className="text-gray-600">
          Genera reportes oficiales para competencias ecuestres
        </p>
      </div>

      {/* Selector de Competencia */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Seleccionar Competencia</h2>
        {competitions.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              ℹ️ No hay competencias disponibles. Crea una competencia primero para generar reportes.
            </p>
          </div>
        ) : (
          <select
            value={selectedCompetition}
            onChange={(e) => setSelectedCompetition(e.target.value)}
            className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecciona una competencia...</option>
            {(competitions || []).map(competition => (
              <option key={competition.id} value={competition.id}>
                {competition.name} - {new Date(competition.start_date).toLocaleDateString()}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Estadísticas de Reportes (Solo Admin) */}
      {isAdmin && reportStats && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Estadísticas de Reportes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {reportStats.total_reports_generated}
              </div>
              <div className="text-gray-600">Reportes Generados</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {reportStats.most_popular_format?.toUpperCase()}
              </div>
              <div className="text-gray-600">Formato Más Popular</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {reportStats.most_requested_report?.replace('_', ' ')}
              </div>
              <div className="text-gray-600">Reporte Más Solicitado</div>
            </div>
          </div>
        </div>
      )}

      {/* Reportes Disponibles */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Reportes Disponibles</h2>
        {availableReports.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-blue-800 text-sm">
              ℹ️ No hay reportes configurados. Los reportes se generan a través del sistema de acciones rápidas abajo.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(availableReports || []).map(report => (
              <ReportCard key={report.name} report={report} />
            ))}
          </div>
        )}
      </div>

      {/* Reportes Rápidos */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Resultados de Competencia */}
          <button
            onClick={() => generateReport('competition_results', 'pdf')}
            disabled={!selectedCompetition || isGenerating}
            className={`p-4 rounded-lg text-left ${
              !selectedCompetition || isGenerating
                ? 'bg-gray-200 cursor-not-allowed'
                : 'bg-white hover:bg-gray-50 border-2 border-blue-200'
            }`}
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">Resultados PDF</div>
            <div className="text-sm text-gray-600">Reporte oficial de resultados</div>
          </button>

          {/* Excel de Resultados */}
          <button
            onClick={() => generateReport('competition_results', 'excel')}
            disabled={!selectedCompetition || isGenerating}
            className={`p-4 rounded-lg text-left ${
              !selectedCompetition || isGenerating
                ? 'bg-gray-200 cursor-not-allowed'
                : 'bg-white hover:bg-gray-50 border-2 border-green-200'
            }`}
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="font-medium">Resultados Excel</div>
            <div className="text-sm text-gray-600">Datos para análisis</div>
          </button>

          {/* Reporte de Juez */}
          {(isJudge || isAdmin) && (
            <button
              onClick={() => generateReport('judge_report', 'pdf')}
              disabled={!selectedCompetition || isGenerating}
              className={`p-4 rounded-lg text-left ${
                !selectedCompetition || isGenerating
                  ? 'bg-gray-200 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 border-2 border-yellow-200'
              }`}
            >
              <div className="text-2xl mb-2">⚖️</div>
              <div className="font-medium">Reporte de Juez</div>
              <div className="text-sm text-gray-600">Mis evaluaciones</div>
            </button>
          )}

          {/* Analytics (Solo Admin) */}
          {isAdmin && (
            <button
              onClick={() => generateReport('analytics_report', 'pdf')}
              disabled={isGenerating}
              className={`p-4 rounded-lg text-left ${
                isGenerating
                  ? 'bg-gray-200 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 border-2 border-purple-200'
              }`}
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="font-medium">Analíticas</div>
              <div className="text-sm text-gray-600">Estadísticas generales</div>
            </button>
          )}
        </div>
      </div>

      {/* Info sobre Reportes */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          ℹ️ Información sobre Reportes FEI
        </h3>
        <ul className="text-blue-800 space-y-1">
          <li>• Los reportes se generan según los estándares oficiales FEI</li>
          <li>• Los archivos PDF incluyen logo oficial y formato profesional</li>
          <li>• Los archivos Excel permiten análisis adicional de datos</li>
          <li>• Todos los reportes incluyen timestamp de generación</li>
        </ul>
      </div>
    </div>
  );
};

export default ReportsDashboard;