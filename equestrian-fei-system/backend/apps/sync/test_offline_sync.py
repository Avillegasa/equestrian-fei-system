"""
Tests para funcionalidad de sincronización offline
"""

import json
import uuid
from datetime import timedelta
from decimal import Decimal

from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status

from apps.users.models import JudgeProfile
from apps.scoring.models import ScoreCard, IndividualScore, ScoringCriteria
from apps.competitions.models import Competition, Registration
from .models import SyncSession, SyncAction, ConflictResolution, OfflineStorage
from .managers import SyncManager, ConflictResolver, DataValidator

User = get_user_model()


class SyncSessionModelTest(TestCase):
    """Tests para el modelo SyncSession"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='judge1',
            email='judge1@test.com',
            password='testpass123',
            user_type='judge'
        )

    def test_create_sync_session(self):
        """Test crear sesión de sincronización"""
        session = SyncSession.objects.create(
            user=self.user,
            device_id='test_device_123'
        )

        self.assertEqual(session.user, self.user)
        self.assertEqual(session.device_id, 'test_device_123')
        self.assertEqual(session.status, 'pending')
        self.assertEqual(session.actions_count, 0)
        self.assertIsNotNone(session.start_time)

    def test_session_duration(self):
        """Test cálculo de duración de sesión"""
        session = SyncSession.objects.create(
            user=self.user,
            device_id='test_device_123'
        )

        # Sesión en progreso
        self.assertIsNotNone(session.duration)

        # Sesión completada
        session.complete(success=True)
        session.refresh_from_db()

        self.assertIsNotNone(session.duration)
        self.assertIsNotNone(session.end_time)
        self.assertEqual(session.status, 'completed')

    def test_success_rate(self):
        """Test cálculo de tasa de éxito"""
        session = SyncSession.objects.create(
            user=self.user,
            device_id='test_device_123',
            actions_count=10,
            successful_actions=8,
            failed_actions=2
        )

        self.assertEqual(session.success_rate, 80.0)

        # Con cero acciones
        empty_session = SyncSession.objects.create(
            user=self.user,
            device_id='test_device_456'
        )
        self.assertEqual(empty_session.success_rate, 0)


class SyncActionModelTest(TestCase):
    """Tests para el modelo SyncAction"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='judge1',
            email='judge1@test.com',
            password='testpass123',
            user_type='judge'
        )

        self.session = SyncSession.objects.create(
            user=self.user,
            device_id='test_device_123'
        )

        # Crear una evaluación de prueba
        self.evaluation = JudgeEvaluation.objects.create(
            judge=self.user,
            total_score=Decimal('85.5'),
            percentage=Decimal('85.5'),
            status='draft'
        )

    def test_create_sync_action(self):
        """Test crear acción de sincronización"""
        content_type = ContentType.objects.get_for_model(JudgeEvaluation)

        action = SyncAction.objects.create(
            sync_session=self.session,
            action_type='score_update',
            content_type=content_type,
            object_id=self.evaluation.id,
            data={'total_score': 85.5, 'status': 'submitted'},
            priority='high'
        )

        self.assertEqual(action.sync_session, self.session)
        self.assertEqual(action.action_type, 'score_update')
        self.assertEqual(action.content_object, self.evaluation)
        self.assertEqual(action.status, 'pending')
        self.assertTrue(action.can_retry())

    def test_action_state_changes(self):
        """Test cambios de estado de acción"""
        content_type = ContentType.objects.get_for_model(JudgeEvaluation)

        action = SyncAction.objects.create(
            sync_session=self.session,
            action_type='update',
            content_type=content_type,
            object_id=self.evaluation.id,
            data={'status': 'submitted'}
        )

        # Marcar como procesando
        action.mark_processing()
        self.assertEqual(action.status, 'processing')

        # Marcar como completado
        action.mark_completed()
        self.assertEqual(action.status, 'completed')
        self.assertIsNotNone(action.processed_at)

        # Test reintentos
        action.status = 'failed'
        action.retry_count = 0
        action.save()

        self.assertTrue(action.can_retry())

        action.retry_count = 3
        action.save()
        self.assertFalse(action.can_retry())


class SyncManagerTest(TransactionTestCase):
    """Tests para SyncManager"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='judge1',
            email='judge1@test.com',
            password='testpass123',
            user_type='judge'
        )

        self.manager = SyncManager()

        # Crear evaluación de prueba
        self.evaluation = JudgeEvaluation.objects.create(
            judge=self.user,
            total_score=Decimal('85.5'),
            percentage=Decimal('85.5'),
            status='draft'
        )

    def test_create_sync_session(self):
        """Test crear sesión con manager"""
        session = self.manager.create_sync_session(
            user=self.user,
            device_id='test_device_123'
        )

        self.assertIsInstance(session, SyncSession)
        self.assertEqual(session.user, self.user)
        self.assertEqual(session.status, 'pending')

    def test_add_sync_action(self):
        """Test agregar acción a sesión"""
        session = self.manager.create_sync_session(
            user=self.user,
            device_id='test_device_123'
        )

        action = self.manager.add_sync_action(
            session=session,
            action_type='score_update',
            content_object=self.evaluation,
            data={'total_score': 90.0},
            priority='high'
        )

        self.assertIsInstance(action, SyncAction)
        self.assertEqual(action.sync_session, session)
        self.assertEqual(action.action_type, 'score_update')

        # Verificar que se actualizó el contador
        session.refresh_from_db()
        self.assertEqual(session.actions_count, 1)

    def test_process_sync_session(self):
        """Test procesamiento de sesión"""
        session = self.manager.create_sync_session(
            user=self.user,
            device_id='test_device_123'
        )

        # Agregar acción simple
        self.manager.add_sync_action(
            session=session,
            action_type='update',
            content_object=self.evaluation,
            data={'status': 'submitted'}
        )

        # Procesar sesión
        results = self.manager.process_sync_session(session)

        self.assertIsInstance(results, dict)
        self.assertIn('total', results)
        self.assertIn('successful', results)
        self.assertIn('failed', results)


class ConflictResolverTest(TestCase):
    """Tests para ConflictResolver"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='judge1',
            email='judge1@test.com',
            password='testpass123',
            user_type='judge'
        )

        self.session = SyncSession.objects.create(
            user=self.user,
            device_id='test_device_123'
        )

        self.evaluation = JudgeEvaluation.objects.create(
            judge=self.user,
            total_score=Decimal('85.5'),
            percentage=Decimal('85.5'),
            status='draft'
        )

        content_type = ContentType.objects.get_for_model(JudgeEvaluation)

        self.action = SyncAction.objects.create(
            sync_session=self.session,
            action_type='update',
            content_type=content_type,
            object_id=self.evaluation.id,
            data={'status': 'submitted', 'total_score': 90.0}
        )

        self.resolver = ConflictResolver()

    def test_create_conflict_resolution(self):
        """Test crear resolución de conflicto"""
        conflict = ConflictResolution.objects.create(
            sync_action=self.action,
            strategy='last_write_wins',
            server_data={'status': 'draft', 'total_score': 85.5},
            client_data={'status': 'submitted', 'total_score': 90.0},
            conflict_fields=['status', 'total_score']
        )

        self.assertEqual(conflict.sync_action, self.action)
        self.assertEqual(conflict.status, 'pending')

    def test_resolve_server_wins(self):
        """Test resolución con estrategia server_wins"""
        conflict = ConflictResolution.objects.create(
            sync_action=self.action,
            strategy='server_wins',
            server_data={'status': 'draft', 'total_score': 85.5},
            client_data={'status': 'submitted', 'total_score': 90.0}
        )

        success = self.resolver.resolve_conflict(conflict, 'server_wins', self.user)

        self.assertTrue(success)
        conflict.refresh_from_db()
        self.assertEqual(conflict.status, 'resolved')
        self.assertEqual(conflict.resolved_data, conflict.server_data)

    def test_resolve_client_wins(self):
        """Test resolución con estrategia client_wins"""
        conflict = ConflictResolution.objects.create(
            sync_action=self.action,
            strategy='client_wins',
            server_data={'status': 'draft', 'total_score': 85.5},
            client_data={'status': 'submitted', 'total_score': 90.0}
        )

        success = self.resolver.resolve_conflict(conflict, 'client_wins', self.user)

        self.assertTrue(success)
        conflict.refresh_from_db()
        self.assertEqual(conflict.status, 'resolved')
        self.assertEqual(conflict.resolved_data, conflict.client_data)


class DataValidatorTest(TestCase):
    """Tests para DataValidator"""

    def setUp(self):
        self.validator = DataValidator()
        self.user = User.objects.create_user(
            username='judge1',
            email='judge1@test.com',
            password='testpass123',
            user_type='judge'
        )

    def test_validate_score_data(self):
        """Test validación de datos de puntuación"""
        # Datos válidos
        valid_data = {
            'scores': [
                {'score': 8.5},
                {'score': 7.0},
                {'score': 9.5}
            ]
        }

        self.assertTrue(self.validator._validate_score_data(valid_data))

        # Puntuación fuera de rango
        invalid_range_data = {
            'scores': [
                {'score': 11.0}  # Fuera de rango
            ]
        }

        self.assertFalse(self.validator._validate_score_data(invalid_range_data))

        # Incremento inválido
        invalid_increment_data = {
            'scores': [
                {'score': 8.3}  # No es múltiplo de 0.5
            ]
        }

        self.assertFalse(self.validator._validate_score_data(invalid_increment_data))


class OfflineStorageModelTest(TestCase):
    """Tests para OfflineStorage"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='judge1',
            email='judge1@test.com',
            password='testpass123',
            user_type='judge'
        )

    def test_create_offline_storage(self):
        """Test crear almacenamiento offline"""
        storage = OfflineStorage.objects.create(
            user=self.user,
            device_id='test_device_123',
            storage_type='score_entry',
            storage_key='evaluation_123_score_456',
            data={'score': 8.5, 'justification': 'Excellent performance'},
            checksum='abc123'
        )

        self.assertEqual(storage.user, self.user)
        self.assertEqual(storage.storage_type, 'score_entry')
        self.assertFalse(storage.is_synced)
        self.assertEqual(storage.version, 1)

    def test_update_data(self):
        """Test actualización de datos offline"""
        storage = OfflineStorage.objects.create(
            user=self.user,
            device_id='test_device_123',
            storage_type='score_entry',
            storage_key='evaluation_123_score_456',
            data={'score': 8.5},
            checksum='abc123'
        )

        # Actualizar datos
        new_data = {'score': 9.0, 'justification': 'Updated score'}
        storage.update_data(new_data)

        self.assertEqual(storage.data, new_data)
        self.assertEqual(storage.version, 2)
        self.assertFalse(storage.is_synced)

    def test_mark_synced(self):
        """Test marcar como sincronizado"""
        storage = OfflineStorage.objects.create(
            user=self.user,
            device_id='test_device_123',
            storage_type='score_entry',
            storage_key='evaluation_123_score_456',
            data={'score': 8.5},
            checksum='abc123'
        )

        storage.mark_synced()
        self.assertTrue(storage.is_synced)


class OfflineSyncAPITest(APITestCase):
    """Tests para APIs de sincronización offline"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='judge1',
            email='judge1@test.com',
            password='testpass123',
            user_type='judge'
        )

        JudgeProfile.objects.create(
            user=self.user,
            license_number='J001',
            certification_level='National'
        )

        self.client.force_authenticate(user=self.user)

    def test_start_sync_session(self):
        """Test iniciar sesión de sincronización"""
        data = {'device_id': 'test_device_123'}

        response = self.client.post('/api/sync/sync-sessions/start_session/', data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['device_id'], 'test_device_123')

    def test_add_action_to_session(self):
        """Test agregar acción a sesión"""
        # Crear sesión
        session = SyncSession.objects.create(
            user=self.user,
            device_id='test_device_123'
        )

        # Crear evaluación de prueba
        evaluation = JudgeEvaluation.objects.create(
            judge=self.user,
            total_score=Decimal('85.5'),
            percentage=Decimal('85.5'),
            status='draft'
        )

        content_type = ContentType.objects.get_for_model(JudgeEvaluation)

        data = {
            'action_type': 'score_update',
            'content_type': content_type.id,
            'object_id': str(evaluation.id),
            'data': {'total_score': 90.0},
            'priority': 'high'
        }

        response = self.client.post(
            f'/api/sync/sync-sessions/{session.id}/add_action/',
            data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('action_id', response.data)

    def test_offline_storage_crud(self):
        """Test CRUD de almacenamiento offline"""
        # Crear entrada
        data = {
            'device_id': 'test_device_123',
            'storage_type': 'score_entry',
            'storage_key': 'eval_123_param_456',
            'data': {'score': 8.5, 'justification': 'Good performance'},
            'checksum': 'abc123'
        }

        response = self.client.post('/api/sync/offline-storage/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        storage_id = response.data['id']

        # Listar entradas
        response = self.client.get('/api/sync/offline-storage/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)

        # Obtener cola de sincronización
        response = self.client.get('/api/sync/offline-storage/sync_queue/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('queue_size', response.data)

        # Marcar como sincronizado
        data = {'item_ids': [storage_id]}
        response = self.client.post('/api/sync/offline-storage/mark_synced/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_bulk_offline_storage(self):
        """Test creación masiva de almacenamiento offline"""
        items = [
            {
                'device_id': 'test_device_123',
                'storage_type': 'score_entry',
                'storage_key': f'eval_123_param_{i}',
                'data': {'score': 8.0 + i * 0.5},
                'checksum': f'hash_{i}'
            }
            for i in range(5)
        ]

        data = {'items': items}

        response = self.client.post('/api/sync/offline-storage/bulk_create/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['created_count'], 5)
        self.assertEqual(len(response.data['created_items']), 5)

    def test_get_sync_status(self):
        """Test obtener estado de sincronización"""
        # Crear algunos datos offline
        OfflineStorage.objects.create(
            user=self.user,
            device_id='test_device_123',
            storage_type='score_entry',
            storage_key='test_key_1',
            data={'score': 8.5},
            checksum='abc123'
        )

        response = self.client.get('/api/sync/offline-sync/status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Debería contener información de sincronización
        self.assertIn('pending_actions', response.data)


class OfflineFunctionalTest(TransactionTestCase):
    """Tests funcionales de extremo a extremo para offline sync"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='judge1',
            email='judge1@test.com',
            password='testpass123',
            user_type='judge'
        )

        self.manager = SyncManager()

    def test_complete_offline_sync_workflow(self):
        """Test flujo completo de sincronización offline"""
        # 1. Crear sesión de sincronización
        session = self.manager.create_sync_session(
            user=self.user,
            device_id='test_device_123'
        )

        # 2. Crear evaluación offline
        evaluation = JudgeEvaluation.objects.create(
            judge=self.user,
            total_score=Decimal('85.5'),
            percentage=Decimal('85.5'),
            status='draft'
        )

        # 3. Agregar acción de actualización
        action = self.manager.add_sync_action(
            session=session,
            action_type='update',
            content_object=evaluation,
            data={'status': 'submitted', 'total_score': 90.0}
        )

        # 4. Procesar sesión
        results = self.manager.process_sync_session(session)

        # 5. Verificar resultados
        self.assertGreater(results['successful'], 0)
        session.refresh_from_db()
        self.assertEqual(session.status, 'completed')

        # 6. Verificar que la evaluación se actualizó
        evaluation.refresh_from_db()
        self.assertEqual(evaluation.status, 'submitted')
        self.assertEqual(float(evaluation.total_score), 90.0)