# Generated migration for offline sync models

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('sync', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SyncSession',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('device_id', models.CharField(max_length=255, verbose_name='ID del dispositivo')),
                ('start_time', models.DateTimeField(auto_now_add=True, verbose_name='Hora de inicio')),
                ('end_time', models.DateTimeField(blank=True, null=True, verbose_name='Hora de fin')),
                ('status', models.CharField(choices=[('pending', 'Pendiente'), ('in_progress', 'En Progreso'), ('completed', 'Completado'), ('failed', 'Fallido')], default='pending', max_length=20, verbose_name='Estado')),
                ('actions_count', models.IntegerField(default=0, verbose_name='Total de acciones')),
                ('successful_actions', models.IntegerField(default=0, verbose_name='Acciones exitosas')),
                ('failed_actions', models.IntegerField(default=0, verbose_name='Acciones fallidas')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sync_sessions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Sesión de Sincronización',
                'verbose_name_plural': 'Sesiones de Sincronización',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='SyncAction',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('action_type', models.CharField(choices=[('create', 'Crear'), ('update', 'Actualizar'), ('delete', 'Eliminar'), ('score_update', 'Actualizar Puntuación')], max_length=20, verbose_name='Tipo de acción')),
                ('priority', models.CharField(choices=[('low', 'Baja'), ('normal', 'Normal'), ('high', 'Alta'), ('urgent', 'Urgente')], default='normal', max_length=10, verbose_name='Prioridad')),
                ('status', models.CharField(choices=[('pending', 'Pendiente'), ('processing', 'Procesando'), ('completed', 'Completado'), ('failed', 'Fallido'), ('conflict', 'Conflicto')], default='pending', max_length=20, verbose_name='Estado')),
                ('object_id', models.UUIDField()),
                ('data', models.JSONField(verbose_name='Datos de la acción')),
                ('original_data', models.JSONField(blank=True, null=True, verbose_name='Datos originales')),
                ('retry_count', models.IntegerField(default=0, verbose_name='Número de reintentos')),
                ('max_retries', models.IntegerField(default=3, verbose_name='Máximo reintentos')),
                ('error_message', models.TextField(blank=True, verbose_name='Mensaje de error')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('processed_at', models.DateTimeField(blank=True, null=True, verbose_name='Procesado en')),
                ('content_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='contenttypes.contenttype')),
                ('sync_session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sync_actions', to='sync.syncsession')),
            ],
            options={
                'verbose_name': 'Acción de Sincronización',
                'verbose_name_plural': 'Acciones de Sincronización',
                'ordering': ['priority', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ConflictResolution',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('strategy', models.CharField(choices=[('server_wins', 'Servidor Gana'), ('client_wins', 'Cliente Gana'), ('last_write_wins', 'Última Escritura Gana'), ('manual_resolution', 'Resolución Manual'), ('merge', 'Fusionar')], max_length=20, verbose_name='Estrategia de resolución')),
                ('status', models.CharField(choices=[('pending', 'Pendiente'), ('resolved', 'Resuelto'), ('rejected', 'Rechazado')], default='pending', max_length=20, verbose_name='Estado')),
                ('server_data', models.JSONField(verbose_name='Datos del servidor')),
                ('client_data', models.JSONField(verbose_name='Datos del cliente')),
                ('resolved_data', models.JSONField(blank=True, null=True, verbose_name='Datos resueltos')),
                ('conflict_fields', models.JSONField(default=list, verbose_name='Campos en conflicto')),
                ('resolution_notes', models.TextField(blank=True, verbose_name='Notas de resolución')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True, verbose_name='Resuelto en')),
                ('resolved_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resolved_conflicts', to=settings.AUTH_USER_MODEL)),
                ('sync_action', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='conflict_resolution', to='sync.syncaction')),
            ],
            options={
                'verbose_name': 'Resolución de Conflicto',
                'verbose_name_plural': 'Resoluciones de Conflictos',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='OfflineStorage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('device_id', models.CharField(max_length=255, verbose_name='ID del dispositivo')),
                ('storage_type', models.CharField(choices=[('score_entry', 'Entrada de Puntuación'), ('evaluation', 'Evaluación'), ('participant_data', 'Datos de Participante'), ('competition_data', 'Datos de Competencia'), ('user_action', 'Acción de Usuario')], max_length=20, verbose_name='Tipo de almacenamiento')),
                ('storage_key', models.CharField(max_length=255, verbose_name='Clave de almacenamiento')),
                ('data', models.JSONField(verbose_name='Datos almacenados')),
                ('metadata', models.JSONField(default=dict, verbose_name='Metadatos')),
                ('version', models.IntegerField(default=1, verbose_name='Versión')),
                ('checksum', models.CharField(max_length=255, verbose_name='Checksum')),
                ('is_synced', models.BooleanField(default=False, verbose_name='Sincronizado')),
                ('sync_priority', models.IntegerField(default=5, verbose_name='Prioridad de sincronización')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('last_accessed', models.DateTimeField(auto_now=True, verbose_name='Último acceso')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='offline_storage', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Almacenamiento Offline',
                'verbose_name_plural': 'Almacenamientos Offline',
                'ordering': ['-updated_at'],
            },
        ),
        # Add indexes
        migrations.AddIndex(
            model_name='syncsession',
            index=models.Index(fields=['user', 'device_id'], name='sync_syncsession_user_device_idx'),
        ),
        migrations.AddIndex(
            model_name='syncsession',
            index=models.Index(fields=['status'], name='sync_syncsession_status_idx'),
        ),
        migrations.AddIndex(
            model_name='syncsession',
            index=models.Index(fields=['start_time'], name='sync_syncsession_start_time_idx'),
        ),
        migrations.AddIndex(
            model_name='syncaction',
            index=models.Index(fields=['sync_session', 'status'], name='sync_syncaction_session_status_idx'),
        ),
        migrations.AddIndex(
            model_name='syncaction',
            index=models.Index(fields=['action_type'], name='sync_syncaction_action_type_idx'),
        ),
        migrations.AddIndex(
            model_name='syncaction',
            index=models.Index(fields=['priority', 'status'], name='sync_syncaction_priority_status_idx'),
        ),
        migrations.AddIndex(
            model_name='syncaction',
            index=models.Index(fields=['content_type', 'object_id'], name='sync_syncaction_content_object_idx'),
        ),
        migrations.AddIndex(
            model_name='offlinestorage',
            index=models.Index(fields=['user', 'device_id'], name='sync_offlinestorage_user_device_idx'),
        ),
        migrations.AddIndex(
            model_name='offlinestorage',
            index=models.Index(fields=['storage_type'], name='sync_offlinestorage_storage_type_idx'),
        ),
        migrations.AddIndex(
            model_name='offlinestorage',
            index=models.Index(fields=['is_synced'], name='sync_offlinestorage_is_synced_idx'),
        ),
        migrations.AddIndex(
            model_name='offlinestorage',
            index=models.Index(fields=['sync_priority'], name='sync_offlinestorage_sync_priority_idx'),
        ),
        # Add unique constraints
        migrations.AddConstraint(
            model_name='offlinestorage',
            constraint=models.UniqueConstraint(fields=['user', 'device_id', 'storage_key'], name='unique_user_device_storage_key'),
        ),
    ]