"""
Vistas para generación de reportes FEI
"""
import logging
from datetime import datetime, timedelta
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .services import fei_report_generator

logger = logging.getLogger(__name__)


class FEIReportsViewSet(viewsets.ViewSet):
    """
    ViewSet para generación de reportes FEI
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def competition_results(self, request):
        """
        Generar reporte de resultados de competencia
        
        Query params:
        - competition_id: ID de la competencia (requerido)
        - format: pdf|excel (default: pdf)
        """
        try:
            competition_id = request.query_params.get('competition_id')
            format_type = request.query_params.get('format', 'pdf').lower()
            
            if not competition_id:
                return Response(
                    {'error': 'competition_id es requerido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if format_type not in ['pdf', 'excel']:
                return Response(
                    {'error': 'Formato debe ser pdf o excel'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generar reporte
            buffer = fei_report_generator.generate_competition_results_report(
                competition_id, format=format_type
            )
            
            # Preparar respuesta
            if format_type == 'pdf':
                response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="competition_results_{competition_id}.pdf"'
            else:  # excel
                response = HttpResponse(
                    buffer.getvalue(),
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                response['Content-Disposition'] = f'attachment; filename="competition_results_{competition_id}.xlsx"'
            
            return response
            
        except Exception as e:
            logger.error(f"Error generando reporte de competencia: {str(e)}")
            return Response(
                {'error': f'Error generando reporte: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def judge_report(self, request):
        """
        Generar reporte específico de juez
        
        Query params:
        - competition_id: ID de la competencia (requerido)
        - judge_id: ID del juez (requerido)
        - format: pdf (default: pdf)
        """
        try:
            competition_id = request.query_params.get('competition_id')
            judge_id = request.query_params.get('judge_id')
            format_type = request.query_params.get('format', 'pdf').lower()
            
            if not competition_id or not judge_id:
                return Response(
                    {'error': 'competition_id y judge_id son requeridos'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Solo jueces pueden ver su propio reporte, admins pueden ver todos
            if not request.user.is_admin() and str(request.user.id) != judge_id:
                return Response(
                    {'error': 'No tienes permisos para ver este reporte'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Generar reporte
            buffer = fei_report_generator.generate_judge_report(
                competition_id, judge_id, format=format_type
            )
            
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="judge_report_{judge_id}_{competition_id}.pdf"'
            
            return response
            
        except Exception as e:
            logger.error(f"Error generando reporte de juez: {str(e)}")
            return Response(
                {'error': f'Error generando reporte: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def analytics_report(self, request):
        """
        Generar reporte de analíticas del sistema
        
        Query params:
        - competition_id: ID específico de competencia (opcional)
        - start_date: Fecha inicio (YYYY-MM-DD) (opcional)
        - end_date: Fecha fin (YYYY-MM-DD) (opcional)
        - format: pdf (default: pdf)
        """
        try:
            # Solo admins pueden generar reportes de analíticas
            if not request.user.is_admin():
                return Response(
                    {'error': 'Solo administradores pueden generar reportes de analíticas'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            competition_id = request.query_params.get('competition_id')
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            format_type = request.query_params.get('format', 'pdf').lower()
            
            # Procesar fechas
            date_range = None
            if start_date and end_date:
                try:
                    start_dt = datetime.strptime(start_date, '%Y-%m-%d').date()
                    end_dt = datetime.strptime(end_date, '%Y-%m-%d').date()
                    date_range = [start_dt, end_dt]
                except ValueError:
                    return Response(
                        {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Generar reporte
            buffer = fei_report_generator.generate_analytics_report(
                competition=competition_id,
                date_range=date_range,
                format=format_type
            )
            
            response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
            filename = f"analytics_report_{timezone.now().strftime('%Y%m%d')}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
            
        except Exception as e:
            logger.error(f"Error generando reporte de analíticas: {str(e)}")
            return Response(
                {'error': f'Error generando reporte: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def available_reports(self, request):
        """
        Listar reportes disponibles para el usuario actual
        """
        user = request.user
        available = []
        
        # Reportes básicos para todos los usuarios autenticados
        available.append({
            'name': 'Competition Results',
            'description': 'Resultados oficiales de competencias',
            'endpoint': '/api/reports/competition_results/',
            'formats': ['pdf', 'excel'],
            'params': ['competition_id', 'format']
        })
        
        # Reportes para jueces
        if user.is_judge() or user.is_admin():
            available.append({
                'name': 'Judge Report',
                'description': 'Reporte personal de evaluaciones',
                'endpoint': '/api/reports/judge_report/',
                'formats': ['pdf'],
                'params': ['competition_id', 'judge_id', 'format']
            })
        
        # Reportes para admins
        if user.is_admin():
            available.append({
                'name': 'Analytics Report',
                'description': 'Analíticas y estadísticas del sistema',
                'endpoint': '/api/reports/analytics_report/',
                'formats': ['pdf'],
                'params': ['competition_id', 'start_date', 'end_date', 'format']
            })
        
        return Response({
            'available_reports': available,
            'user_role': user.role,
            'total_reports': len(available)
        })
    
    @action(detail=False, methods=['get'])
    def report_templates(self, request):
        """
        Obtener templates disponibles para personalización
        """
        templates = {
            'competition_results': {
                'name': 'Competition Results Template',
                'description': 'Template oficial FEI para resultados',
                'customizable_fields': [
                    'header_logo', 'competition_info', 'results_table', 'footer'
                ]
            },
            'judge_report': {
                'name': 'Judge Report Template', 
                'description': 'Template para reportes de jueces',
                'customizable_fields': [
                    'judge_info', 'evaluations_table', 'comments'
                ]
            },
            'analytics': {
                'name': 'Analytics Dashboard Template',
                'description': 'Template para analíticas del sistema',
                'customizable_fields': [
                    'date_range', 'charts', 'statistics', 'export_format'
                ]
            }
        }
        
        return Response({
            'templates': templates,
            'customization_available': True
        })


class ReportsStatsViewSet(viewsets.ViewSet):
    """
    ViewSet para estadísticas de reportes
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def usage_stats(self, request):
        """
        Estadísticas de uso de reportes
        """
        if not request.user.is_admin():
            return Response(
                {'error': 'Solo administradores pueden ver estadísticas'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Aquí podrías agregar lógica para trackear uso de reportes
        # Por ahora, datos de ejemplo
        stats = {
            'total_reports_generated': 0,  # Se incrementaría con cada generación
            'most_popular_format': 'pdf',
            'most_requested_report': 'competition_results',
            'reports_by_type': {
                'competition_results': 0,
                'judge_reports': 0,
                'analytics': 0
            },
            'reports_by_format': {
                'pdf': 0,
                'excel': 0
            },
            'last_30_days': []  # Array de reportes generados por día
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def system_health(self, request):
        """
        Estado de salud del sistema de reportes
        """
        health = {
            'reportlab_available': True,  # Se verifica en services.py
            'pandas_available': True,
            'matplotlib_available': True,
            'templates_loaded': True,
            'last_check': timezone.now().isoformat(),
            'status': 'healthy'
        }
        
        try:
            # Verificaciones básicas
            from .services import REPORTLAB_AVAILABLE, ANALYTICS_AVAILABLE
            health['reportlab_available'] = REPORTLAB_AVAILABLE
            health['pandas_available'] = ANALYTICS_AVAILABLE
            health['matplotlib_available'] = ANALYTICS_AVAILABLE
            
            if not (REPORTLAB_AVAILABLE and ANALYTICS_AVAILABLE):
                health['status'] = 'warning'
                
        except Exception as e:
            health['status'] = 'error'
            health['error'] = str(e)
        
        return Response(health)
