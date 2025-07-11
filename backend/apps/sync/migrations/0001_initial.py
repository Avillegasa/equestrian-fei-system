# Generated by Django 5.0.7 on 2025-07-08 19:54

import django.core.serializers.json
import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("contenttypes", "0002_remove_content_type_name"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="SyncSession",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "device_id",
                    models.CharField(
                        help_text="ID único del dispositivo", max_length=255
                    ),
                ),
                ("session_token", models.CharField(max_length=255, unique=True)),
                (
                    "device_type",
                    models.CharField(
                        choices=[
                            ("mobile", "Móvil"),
                            ("tablet", "Tablet"),
                            ("desktop", "Escritorio"),
                            ("other", "Otro"),
                        ],
                        max_length=50,
                    ),
                ),
                ("user_agent", models.TextField(blank=True)),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("last_sync_time", models.DateTimeField(blank=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="SyncLog",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "event_type",
                    models.CharField(
                        choices=[
                            ("sync_start", "Inicio de Sincronización"),
                            ("sync_complete", "Sincronización Completada"),
                            ("sync_error", "Error de Sincronización"),
                            ("action_processed", "Acción Procesada"),
                            ("conflict_detected", "Conflicto Detectado"),
                            ("conflict_resolved", "Conflicto Resuelto"),
                            ("data_cached", "Datos Cacheados"),
                            ("cache_cleared", "Cache Limpiado"),
                        ],
                        max_length=50,
                    ),
                ),
                ("message", models.TextField()),
                (
                    "details",
                    models.JSONField(
                        default=dict,
                        encoder=django.core.serializers.json.DjangoJSONEncoder,
                    ),
                ),
                (
                    "duration_ms",
                    models.IntegerField(
                        blank=True, help_text="Duración en milisegundos", null=True
                    ),
                ),
                ("actions_processed", models.IntegerField(blank=True, null=True)),
                ("errors_count", models.IntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "sync_session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="logs",
                        to="sync.syncsession",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="SyncAction",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "action_type",
                    models.CharField(
                        choices=[
                            ("create", "Crear"),
                            ("update", "Actualizar"),
                            ("delete", "Eliminar"),
                            ("score_update", "Actualizar Puntuación"),
                            ("participant_registration", "Registrar Participante"),
                            ("judge_assignment", "Asignar Juez"),
                        ],
                        max_length=50,
                    ),
                ),
                (
                    "client_id",
                    models.CharField(help_text="ID único del cliente", max_length=255),
                ),
                ("object_id", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "data",
                    models.JSONField(
                        default=dict,
                        encoder=django.core.serializers.json.DjangoJSONEncoder,
                    ),
                ),
                (
                    "original_data",
                    models.JSONField(
                        default=dict,
                        encoder=django.core.serializers.json.DjangoJSONEncoder,
                        help_text="Datos originales antes de la modificación",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pendiente"),
                            ("processing", "Procesando"),
                            ("completed", "Completada"),
                            ("failed", "Fallida"),
                            ("cancelled", "Cancelada"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                (
                    "priority",
                    models.IntegerField(
                        default=0,
                        help_text="Prioridad de procesamiento (mayor = más prioritario)",
                    ),
                ),
                ("retry_count", models.IntegerField(default=0)),
                ("max_retries", models.IntegerField(default=3)),
                ("error_message", models.TextField(blank=True)),
                (
                    "error_details",
                    models.JSONField(
                        default=dict,
                        encoder=django.core.serializers.json.DjangoJSONEncoder,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("processed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "content_type",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="contenttypes.contenttype",
                    ),
                ),
                (
                    "sync_session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="actions",
                        to="sync.syncsession",
                    ),
                ),
            ],
            options={
                "ordering": ["-priority", "created_at"],
            },
        ),
        migrations.CreateModel(
            name="OfflineData",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "data_type",
                    models.CharField(
                        choices=[
                            ("competition", "Competencia"),
                            ("category", "Categoría"),
                            ("participant", "Participante"),
                            ("judge", "Juez"),
                            ("score", "Puntuación"),
                            ("ranking", "Ranking"),
                        ],
                        max_length=50,
                    ),
                ),
                (
                    "object_id",
                    models.CharField(
                        help_text="ID del objeto original", max_length=255
                    ),
                ),
                (
                    "data",
                    models.JSONField(
                        encoder=django.core.serializers.json.DjangoJSONEncoder
                    ),
                ),
                ("version", models.IntegerField(default=1)),
                (
                    "checksum",
                    models.CharField(help_text="Hash MD5 de los datos", max_length=64),
                ),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "sync_session",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="cached_data",
                        to="sync.syncsession",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="SyncConflict",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "conflict_type",
                    models.CharField(
                        choices=[
                            ("concurrent_update", "Actualización Concurrente"),
                            ("data_mismatch", "Datos Inconsistentes"),
                            ("validation_error", "Error de Validación"),
                            ("permission_denied", "Permisos Insuficientes"),
                        ],
                        max_length=50,
                    ),
                ),
                ("description", models.TextField()),
                (
                    "client_data",
                    models.JSONField(
                        encoder=django.core.serializers.json.DjangoJSONEncoder
                    ),
                ),
                (
                    "server_data",
                    models.JSONField(
                        encoder=django.core.serializers.json.DjangoJSONEncoder
                    ),
                ),
                (
                    "resolution_strategy",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("client_wins", "Cliente Gana"),
                            ("server_wins", "Servidor Gana"),
                            ("merge", "Fusionar"),
                            ("manual", "Resolución Manual"),
                        ],
                        max_length=20,
                        null=True,
                    ),
                ),
                (
                    "resolved_data",
                    models.JSONField(
                        blank=True,
                        encoder=django.core.serializers.json.DjangoJSONEncoder,
                        null=True,
                    ),
                ),
                ("resolved_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "resolved_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "sync_action",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="conflict",
                        to="sync.syncaction",
                    ),
                ),
            ],
            options={
                "indexes": [
                    models.Index(
                        fields=["conflict_type", "resolved_at"],
                        name="sync_syncco_conflic_377934_idx",
                    ),
                    models.Index(
                        fields=["created_at"], name="sync_syncco_created_15aabc_idx"
                    ),
                ],
            },
        ),
        migrations.AddIndex(
            model_name="syncsession",
            index=models.Index(
                fields=["user", "device_id"], name="sync_syncse_user_id_4a3c95_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="syncsession",
            index=models.Index(
                fields=["session_token"], name="sync_syncse_session_a1c996_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="syncsession",
            index=models.Index(
                fields=["last_sync_time"], name="sync_syncse_last_sy_0bd22b_idx"
            ),
        ),
        migrations.AlterUniqueTogether(
            name="syncsession",
            unique_together={("user", "device_id")},
        ),
        migrations.AddIndex(
            model_name="synclog",
            index=models.Index(
                fields=["sync_session", "event_type"],
                name="sync_synclo_sync_se_2c2063_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="synclog",
            index=models.Index(
                fields=["created_at"], name="sync_synclo_created_a77819_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="syncaction",
            index=models.Index(
                fields=["sync_session", "status"], name="sync_syncac_sync_se_1aaaab_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="syncaction",
            index=models.Index(
                fields=["action_type", "status"], name="sync_syncac_action__c70514_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="syncaction",
            index=models.Index(
                fields=["priority", "created_at"], name="sync_syncac_priorit_2e2727_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="syncaction",
            index=models.Index(
                fields=["client_id"], name="sync_syncac_client__51b703_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="offlinedata",
            index=models.Index(
                fields=["sync_session", "data_type"],
                name="sync_offlin_sync_se_53fbbe_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="offlinedata",
            index=models.Index(
                fields=["expires_at"], name="sync_offlin_expires_aac371_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="offlinedata",
            index=models.Index(
                fields=["checksum"], name="sync_offlin_checksu_d964d6_idx"
            ),
        ),
        migrations.AlterUniqueTogether(
            name="offlinedata",
            unique_together={("sync_session", "data_type", "object_id")},
        ),
    ]
