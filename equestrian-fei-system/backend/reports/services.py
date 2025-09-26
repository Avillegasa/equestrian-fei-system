"""
Servicios para generación de reportes FEI
"""
import os
import io
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
from django.conf import settings
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone

logger = logging.getLogger(__name__)

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.platypus import Image, PageBreak
    from reportlab.lib.units import inch
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    logger.warning("ReportLab no disponible. Funcionalidad PDF limitada.")

try:
    # import pandas as pd
    # import matplotlib.pyplot as plt
    # import seaborn as sns
    # ANALYTICS_AVAILABLE = True
    ANALYTICS_AVAILABLE = False
    logger.warning("Pandas/Matplotlib temporalmente deshabilitado. Analíticas limitadas.")
except ImportError:
    ANALYTICS_AVAILABLE = False
    logger.warning("Pandas/Matplotlib no disponible. Analíticas limitadas.")


class FEIReportGenerator:
    """
    Generador de reportes FEI específicos
    """
    
    def __init__(self):
        self.styles = getSampleStyleSheet() if REPORTLAB_AVAILABLE else None
        if self.styles:
            self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Configurar estilos personalizados para reportes FEI"""
        self.styles.add(ParagraphStyle(
            name='FEITitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            textColor=colors.HexColor('#1f4e79'),
            alignment=1  # Center
        ))
        
        self.styles.add(ParagraphStyle(
            name='FEISubtitle',
            parent=self.styles['Heading2'],
            fontSize=12,
            spaceAfter=20,
            textColor=colors.HexColor('#2d5aa0'),
        ))
        
        self.styles.add(ParagraphStyle(
            name='FEIBody',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=12,
        ))
    
    def generate_competition_results_report(self, competition, format='pdf'):
        """
        Generar reporte oficial de resultados FEI
        """
        if format == 'pdf' and not REPORTLAB_AVAILABLE:
            raise ValueError("ReportLab requerido para generar PDFs")
        
        from apps.competitions.models import Competition
        from apps.scoring.models import CompetitionRanking
        
        if isinstance(competition, str):
            competition = Competition.objects.get(id=competition)
        
        # Obtener datos de la competencia
        rankings = CompetitionRanking.objects.filter(
            competition=competition
        ).select_related('participant', 'participant__horse', 'participant__rider').order_by('final_position')
        
        data = {
            'competition': competition,
            'rankings': rankings,
            'generated_at': timezone.now(),
            'total_participants': rankings.count()
        }
        
        if format == 'pdf':
            return self._generate_pdf_results(data)
        elif format == 'excel':
            return self._generate_excel_results(data)
        else:
            raise ValueError(f"Formato no soportado: {format}")
    
    def _generate_pdf_results(self, data):
        """Generar PDF de resultados"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        competition = data['competition']
        
        # Header FEI
        title = Paragraph(
            f"FÉDÉRATION EQUESTRE INTERNATIONALE<br/>OFFICIAL RESULTS",
            self.styles['FEITitle']
        )
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Información de la competencia
        comp_info = [
            ['Competition:', competition.name],
            ['Venue:', competition.venue.name if competition.venue else 'N/A'],
            ['Date:', competition.start_date.strftime('%Y-%m-%d')],
            ['Discipline:', competition.discipline.name],
            ['Category:', competition.category.name],
            ['Total Participants:', str(data['total_participants'])],
        ]
        
        comp_table = Table(comp_info, colWidths=[2*inch, 4*inch])
        comp_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(comp_table)
        story.append(Spacer(1, 30))
        
        # Tabla de resultados
        if data['rankings']:
            story.append(Paragraph("FINAL RESULTS", self.styles['FEISubtitle']))
            
            # Header de la tabla
            results_data = [['Pos', 'Rider', 'Horse', 'Nation', 'Final Score', 'Time']]
            
            for ranking in data['rankings']:
                participant = ranking.participant
                results_data.append([
                    str(ranking.final_position),
                    f"{participant.rider.first_name} {participant.rider.last_name}",
                    participant.horse.name,
                    participant.rider.nationality or 'N/A',
                    f"{ranking.final_score:.2f}",
                    str(ranking.total_time) if ranking.total_time else 'N/A'
                ])
            
            results_table = Table(results_data, colWidths=[0.8*inch, 1.5*inch, 1.5*inch, 1*inch, 1*inch, 1*inch])
            results_table.setStyle(TableStyle([
                # Header
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f4e79')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                # Data rows
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                # Zebra striping
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')])
            ]))
            story.append(results_table)
        
        # Footer
        story.append(Spacer(1, 40))
        footer = Paragraph(
            f"Report generated on {data['generated_at'].strftime('%Y-%m-%d %H:%M:%S')} UTC<br/>"
            f"Sistema FEI - Competencias Ecuestres v1.0",
            self.styles['Normal']
        )
        story.append(footer)
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def _generate_excel_results(self, data):
        """Generar Excel de resultados"""
        if not ANALYTICS_AVAILABLE:
            raise ValueError("Pandas requerido para generar Excel")
        
        competition = data['competition']
        rankings = data['rankings']
        
        # Crear DataFrame
        results_data = []
        for ranking in rankings:
            participant = ranking.participant
            results_data.append({
                'Position': ranking.final_position,
                'Rider': f"{participant.rider.first_name} {participant.rider.last_name}",
                'Horse': participant.horse.name,
                'Nation': participant.rider.nationality or 'N/A',
                'Final Score': ranking.final_score,
                'Total Time': str(ranking.total_time) if ranking.total_time else 'N/A',
                'Penalties': ranking.penalties or 0,
            })
        
        df = pd.DataFrame(results_data)
        
        # Crear buffer
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            # Información de la competencia
            info_df = pd.DataFrame({
                'Field': ['Competition', 'Venue', 'Date', 'Discipline', 'Category', 'Participants'],
                'Value': [
                    competition.name,
                    competition.venue.name if competition.venue else 'N/A',
                    competition.start_date.strftime('%Y-%m-%d'),
                    competition.discipline.name,
                    competition.category.name,
                    len(results_data)
                ]
            })
            info_df.to_excel(writer, sheet_name='Competition Info', index=False)
            
            # Resultados
            df.to_excel(writer, sheet_name='Results', index=False)
        
        buffer.seek(0)
        return buffer
    
    def generate_judge_report(self, competition, judge, format='pdf'):
        """
        Generar reporte específico para juez
        """
        from apps.competitions.models import Competition
        from apps.scoring.models import ScoreCard, IndividualScore
        from apps.users.models import User
        
        if isinstance(competition, str):
            competition = Competition.objects.get(id=competition)
        if isinstance(judge, str):
            judge = User.objects.get(id=judge)
        
        # Obtener puntuaciones del juez
        score_cards = ScoreCard.objects.filter(
            competition=competition,
            judge=judge
        ).select_related('participant', 'participant__horse', 'participant__rider')
        
        data = {
            'competition': competition,
            'judge': judge,
            'score_cards': score_cards,
            'total_evaluations': score_cards.count(),
            'generated_at': timezone.now()
        }
        
        if format == 'pdf':
            return self._generate_judge_pdf(data)
        else:
            raise ValueError(f"Formato no soportado: {format}")
    
    def _generate_judge_pdf(self, data):
        """Generar PDF reporte de juez"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        competition = data['competition']
        judge = data['judge']
        
        # Header
        title = Paragraph(
            f"JUDGE REPORT<br/>{judge.first_name} {judge.last_name}",
            self.styles['FEITitle']
        )
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Información
        judge_info = [
            ['Competition:', competition.name],
            ['Judge:', f"{judge.first_name} {judge.last_name}"],
            ['License:', getattr(judge.judge_profile, 'license_number', 'N/A') if hasattr(judge, 'judge_profile') else 'N/A'],
            ['Date:', competition.start_date.strftime('%Y-%m-%d')],
            ['Total Evaluations:', str(data['total_evaluations'])],
        ]
        
        info_table = Table(judge_info, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 30))
        
        # Evaluaciones
        if data['score_cards']:
            story.append(Paragraph("EVALUATIONS", self.styles['FEISubtitle']))
            
            eval_data = [['Rider', 'Horse', 'Score', 'Comments']]
            
            for card in data['score_cards']:
                participant = card.participant
                eval_data.append([
                    f"{participant.rider.first_name} {participant.rider.last_name}",
                    participant.horse.name,
                    f"{card.total_score:.2f}",
                    (card.comments[:50] + '...' if len(card.comments or '') > 50 else card.comments or 'N/A')
                ])
            
            eval_table = Table(eval_data, colWidths=[1.5*inch, 1.5*inch, 1*inch, 2.5*inch])
            eval_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f4e79')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(eval_table)
        
        # Footer
        story.append(Spacer(1, 40))
        footer = Paragraph(
            f"Report generated on {data['generated_at'].strftime('%Y-%m-%d %H:%M:%S')} UTC",
            self.styles['Normal']
        )
        story.append(footer)
        
        doc.build(story)
        buffer.seek(0)
        return buffer
    
    def generate_analytics_report(self, competition=None, date_range=None, format='pdf'):
        """
        Generar reporte de analíticas del sistema
        """
        if not ANALYTICS_AVAILABLE:
            raise ValueError("Pandas y Matplotlib requeridos para analíticas")
        
        from apps.competitions.models import Competition, Participant
        from apps.scoring.models import ScoreCard, CompetitionRanking
        
        # Filtros
        competitions = Competition.objects.all()
        if competition:
            competitions = competitions.filter(id=competition)
        if date_range:
            competitions = competitions.filter(
                start_date__gte=date_range[0],
                end_date__lte=date_range[1]
            )
        
        # Estadísticas generales
        total_competitions = competitions.count()
        total_participants = Participant.objects.filter(competition__in=competitions).count()
        total_evaluations = ScoreCard.objects.filter(competition__in=competitions).count()
        
        data = {
            'total_competitions': total_competitions,
            'total_participants': total_participants,
            'total_evaluations': total_evaluations,
            'competitions': competitions,
            'generated_at': timezone.now(),
            'date_range': date_range
        }
        
        if format == 'pdf':
            return self._generate_analytics_pdf(data)
        else:
            raise ValueError(f"Formato no soportado: {format}")
    
    def _generate_analytics_pdf(self, data):
        """Generar PDF de analíticas"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        # Header
        title = Paragraph("SYSTEM ANALYTICS REPORT", self.styles['FEITitle'])
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Estadísticas generales
        stats = [
            ['Total Competitions:', str(data['total_competitions'])],
            ['Total Participants:', str(data['total_participants'])],
            ['Total Evaluations:', str(data['total_evaluations'])],
            ['Generated:', data['generated_at'].strftime('%Y-%m-%d %H:%M:%S')],
        ]
        
        if data['date_range']:
            stats.append(['Date Range:', f"{data['date_range'][0]} to {data['date_range'][1]}"])
        
        stats_table = Table(stats, colWidths=[2*inch, 3*inch])
        stats_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(stats_table)
        story.append(Spacer(1, 30))
        
        # Lista de competencias
        if data['competitions']:
            story.append(Paragraph("COMPETITIONS", self.styles['FEISubtitle']))
            
            comp_data = [['Name', 'Date', 'Participants', 'Status']]
            
            for comp in data['competitions'][:20]:  # Limitar a 20
                participant_count = comp.participants.count()
                status = 'Completed' if comp.end_date < timezone.now().date() else 'Active'
                
                comp_data.append([
                    comp.name[:30] + '...' if len(comp.name) > 30 else comp.name,
                    comp.start_date.strftime('%Y-%m-%d'),
                    str(participant_count),
                    status
                ])
            
            comp_table = Table(comp_data, colWidths=[2.5*inch, 1*inch, 1*inch, 1*inch])
            comp_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f4e79')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            story.append(comp_table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer


# Instancia global del servicio
fei_report_generator = FEIReportGenerator()