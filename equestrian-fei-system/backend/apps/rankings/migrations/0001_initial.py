# Generated migration for rankings system

import uuid
import django.core.validators
from django.conf import settings
import django.contrib.contenttypes.fields
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('competitions', '0001_initial'),
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='LiveRanking',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=200, verbose_name='Nombre del ranking')),
                ('ranking_type', models.CharField(choices=[('overall', 'General'), ('category', 'Por Categoría'), ('round', 'Por Ronda'), ('discipline', 'Por Disciplina'), ('team', 'Por Equipo'), ('qualification', 'Clasificatorio')], default='overall', max_length=20, verbose_name='Tipo de ranking')),
                ('status', models.CharField(choices=[('active', 'Activo'), ('paused', 'Pausado'), ('completed', 'Completado'), ('archived', 'Archivado')], default='active', max_length=20, verbose_name='Estado')),
                ('calculation_method', models.CharField(default='cumulative', max_length=50, verbose_name='Método de cálculo')),
                ('update_frequency', models.PositiveIntegerField(default=30, verbose_name='Frecuencia de actualización (segundos)')),
                ('round_number', models.PositiveIntegerField(default=1, verbose_name='Número de ronda')),
                ('last_updated', models.DateTimeField(auto_now=True, verbose_name='Última actualización')),
                ('next_update', models.DateTimeField(blank=True, null=True, verbose_name='Próxima actualización')),
                ('is_live', models.BooleanField(default=True, verbose_name='En vivo')),
                ('is_public', models.BooleanField(default=True, verbose_name='Público')),
                ('auto_publish', models.BooleanField(default=True, verbose_name='Auto publicar')),
                ('description', models.TextField(blank=True, verbose_name='Descripción')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='live_rankings', to='competitions.category')),
                ('competition', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='live_rankings', to='competitions.competition')),
            ],
            options={
                'verbose_name': 'Ranking en Vivo',
                'verbose_name_plural': 'Rankings en Vivo',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='RankingRule',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100, verbose_name='Nombre de la regla')),
                ('rule_type', models.CharField(choices=[('scoring', 'Puntuación'), ('penalty', 'Penalización'), ('time', 'Tiempo'), ('elimination', 'Eliminación'), ('tiebreaker', 'Desempate'), ('qualification', 'Clasificación')], max_length=20, verbose_name='Tipo de regla')),
                ('description', models.TextField(verbose_name='Descripción')),
                ('field_name', models.CharField(max_length=50, verbose_name='Campo a evaluar')),
                ('operator', models.CharField(choices=[('gt', 'Mayor que'), ('gte', 'Mayor o igual que'), ('lt', 'Menor que'), ('lte', 'Menor o igual que'), ('eq', 'Igual a'), ('ne', 'Diferente de')], max_length=10, verbose_name='Operador')),
                ('threshold_value', models.DecimalField(decimal_places=3, max_digits=10, verbose_name='Valor umbral')),
                ('action', models.CharField(max_length=50, verbose_name='Acción')),
                ('priority', models.PositiveIntegerField(default=1, verbose_name='Prioridad')),
                ('is_active', models.BooleanField(default=True, verbose_name='Activa')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('competition', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ranking_rules', to='competitions.competition')),
            ],
            options={
                'verbose_name': 'Regla de Ranking',
                'verbose_name_plural': 'Reglas de Rankings',
                'ordering': ['priority', 'name'],
            },
        ),
        migrations.CreateModel(
            name='TeamRanking',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('team_name', models.CharField(max_length=200, verbose_name='Nombre del equipo')),
                ('team_code', models.CharField(max_length=20, verbose_name='Código del equipo')),
                ('country_code', models.CharField(blank=True, max_length=3, verbose_name='Código de país')),
                ('position', models.PositiveIntegerField(verbose_name='Posición')),
                ('total_score', models.DecimalField(decimal_places=3, default=0, max_digits=10, verbose_name='Puntuación total')),
                ('average_score', models.DecimalField(decimal_places=3, default=0, max_digits=8, verbose_name='Puntuación promedio')),
                ('members_count', models.PositiveIntegerField(default=0, verbose_name='Número de miembros')),
                ('qualified_members', models.PositiveIntegerField(default=0, verbose_name='Miembros clasificados')),
                ('best_individual_score', models.DecimalField(decimal_places=3, default=0, max_digits=8, verbose_name='Mejor puntuación individual')),
                ('is_qualified', models.BooleanField(default=False, verbose_name='Clasificado')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('competition', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='team_rankings', to='competitions.competition')),
            ],
            options={
                'verbose_name': 'Ranking por Equipos',
                'verbose_name_plural': 'Rankings por Equipos',
                'ordering': ['position'],
            },
        ),
        migrations.CreateModel(
            name='RankingSnapshot',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('snapshot_time', models.DateTimeField(auto_now_add=True, verbose_name='Momento de la instantánea')),
                ('round_number', models.PositiveIntegerField(verbose_name='Número de ronda')),
                ('event_trigger', models.CharField(blank=True, max_length=100, verbose_name='Evento disparador')),
                ('total_participants', models.PositiveIntegerField(default=0, verbose_name='Total de participantes')),
                ('active_participants', models.PositiveIntegerField(default=0, verbose_name='Participantes activos')),
                ('completed_rounds', models.PositiveIntegerField(default=0, verbose_name='Rondas completadas')),
                ('notes', models.TextField(blank=True, verbose_name='Notas')),
                ('live_ranking', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='snapshots', to='rankings.liveranking')),
            ],
            options={
                'verbose_name': 'Instantánea de Ranking',
                'verbose_name_plural': 'Instantáneas de Rankings',
                'ordering': ['-snapshot_time'],
            },
        ),
        migrations.CreateModel(
            name='LiveRankingEntry',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('position', models.PositiveIntegerField(verbose_name='Posición actual')),
                ('previous_position', models.PositiveIntegerField(blank=True, null=True, verbose_name='Posición anterior')),
                ('position_change', models.IntegerField(default=0, verbose_name='Cambio de posición')),
                ('current_score', models.DecimalField(decimal_places=3, default=0, max_digits=10, verbose_name='Puntuación actual')),
                ('previous_score', models.DecimalField(decimal_places=3, default=0, max_digits=10, verbose_name='Puntuación anterior')),
                ('total_penalties', models.DecimalField(decimal_places=3, default=0, max_digits=8, verbose_name='Penalizaciones totales')),
                ('rounds_completed', models.PositiveIntegerField(default=0, verbose_name='Rondas completadas')),
                ('best_score', models.DecimalField(decimal_places=3, default=0, max_digits=8, verbose_name='Mejor puntuación')),
                ('average_score', models.DecimalField(decimal_places=3, default=0, max_digits=8, verbose_name='Puntuación promedio')),
                ('technical_score', models.DecimalField(decimal_places=3, default=0, max_digits=8, verbose_name='Puntuación técnica')),
                ('artistic_score', models.DecimalField(decimal_places=3, default=0, max_digits=8, verbose_name='Puntuación artística')),
                ('time_score', models.DecimalField(decimal_places=3, default=0, max_digits=8, verbose_name='Puntuación de tiempo')),
                ('is_active', models.BooleanField(default=True, verbose_name='Activo')),
                ('is_eliminated', models.BooleanField(default=False, verbose_name='Eliminado')),
                ('elimination_reason', models.CharField(blank=True, max_length=200, verbose_name='Razón de eliminación')),
                ('consistency_score', models.DecimalField(decimal_places=2, default=0, max_digits=5, verbose_name='Puntuación de consistencia')),
                ('improvement_trend', models.CharField(default='stable', max_length=20, verbose_name='Tendencia de mejora')),
                ('last_score_update', models.DateTimeField(auto_now=True, verbose_name='Última actualización de puntuación')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('participant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='live_ranking_entries', to='competitions.participant')),
                ('ranking', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='entries', to='rankings.liveranking')),
            ],
            options={
                'verbose_name': 'Entrada de Ranking en Vivo',
                'verbose_name_plural': 'Entradas de Rankings en Vivo',
                'ordering': ['position'],
            },
        ),
        migrations.AddConstraint(
            model_name='teamranking',
            constraint=models.UniqueConstraint(fields=('competition', 'team_name'), name='unique_team_per_competition'),
        ),
        migrations.AddConstraint(
            model_name='liveranking',
            constraint=models.UniqueConstraint(fields=('competition', 'category', 'ranking_type', 'round_number'), name='unique_ranking_per_competition_category_type_round'),
        ),
        migrations.AddConstraint(
            model_name='liverankingentry',
            constraint=models.UniqueConstraint(fields=('ranking', 'participant'), name='unique_participant_per_ranking'),
        ),
    ]