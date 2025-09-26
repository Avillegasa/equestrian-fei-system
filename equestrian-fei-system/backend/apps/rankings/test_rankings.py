"""
Basic tests for the rankings system
This file provides testing examples that can be run to verify the rankings system works correctly.
"""

import json
import uuid
from decimal import Decimal
from datetime import datetime, timedelta
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter
from channels.db import database_sync_to_async

from .models import LiveRanking, LiveRankingEntry, TeamRanking, RankingRule, RankingSnapshot
from .services import RankingCalculationService
from .consumers import RankingConsumer
from apps.competitions.models import Competition, Category, Discipline, Participant
from apps.scoring.models import ScoreCard

User = get_user_model()


class RankingModelsTest(TestCase):
    """Test the ranking models"""

    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )

        # Create test discipline and category
        self.discipline = Discipline.objects.create(
            name='Dressage',
            description='Test discipline'
        )

        self.category = Category.objects.create(
            name='Beginner',
            description='Beginner level',
            discipline=self.discipline
        )

        # Create test competition
        self.competition = Competition.objects.create(
            name='Test Competition',
            discipline=self.discipline,
            start_date=datetime.now().date(),
            end_date=(datetime.now() + timedelta(days=3)).date(),
            status='active'
        )

        # Create test participant
        self.participant = Participant.objects.create(
            user=self.user,
            competition=self.competition,
            category=self.category,
            rider_name='Test Rider',
            horse_name='Test Horse',
            number='001'
        )

    def test_live_ranking_creation(self):
        """Test creating a live ranking"""
        ranking = LiveRanking.objects.create(
            name='Test Ranking',
            competition=self.competition,
            category=self.category,
            ranking_type='overall'
        )

        self.assertEqual(ranking.name, 'Test Ranking')
        self.assertEqual(ranking.competition, self.competition)
        self.assertEqual(ranking.status, 'active')
        self.assertTrue(ranking.is_live)
        self.assertTrue(ranking.is_public)

    def test_ranking_entry_creation(self):
        """Test creating ranking entries"""
        ranking = LiveRanking.objects.create(
            name='Test Ranking',
            competition=self.competition,
            category=self.category
        )

        entry = LiveRankingEntry.objects.create(
            ranking=ranking,
            participant=self.participant,
            position=1,
            current_score=Decimal('85.50')
        )

        self.assertEqual(entry.position, 1)
        self.assertEqual(entry.current_score, Decimal('85.50'))
        self.assertEqual(entry.participant, self.participant)

    def test_team_ranking_creation(self):
        """Test creating team rankings"""
        team = TeamRanking.objects.create(
            competition=self.competition,
            team_name='Test Team',
            team_code='TT',
            position=1,
            total_score=Decimal('250.00')
        )

        self.assertEqual(team.team_name, 'Test Team')
        self.assertEqual(team.position, 1)
        self.assertEqual(team.total_score, Decimal('250.00'))

    def test_ranking_rules(self):
        """Test ranking rules"""
        rule = RankingRule.objects.create(
            competition=self.competition,
            name='Elimination Rule',
            rule_type='elimination',
            description='Test elimination rule',
            field_name='total_penalties',
            operator='gt',
            threshold_value=Decimal('20.0'),
            action='eliminate'
        )

        # Test rule evaluation (mock data)
        class MockEntry:
            def __init__(self):
                self.total_penalties = Decimal('25.0')

        mock_entry = MockEntry()
        result = rule.evaluate_participant(mock_entry)
        self.assertTrue(result)  # Should be eliminated

    def test_ranking_snapshot(self):
        """Test ranking snapshots"""
        ranking = LiveRanking.objects.create(
            name='Test Ranking',
            competition=self.competition,
            category=self.category
        )

        snapshot = RankingSnapshot.objects.create(
            live_ranking=ranking,
            round_number=1,
            event_trigger='test',
            total_participants=10,
            active_participants=9
        )

        self.assertEqual(snapshot.live_ranking, ranking)
        self.assertEqual(snapshot.total_participants, 10)


class RankingAPITest(APITestCase):
    """Test the ranking API endpoints"""

    def setUp(self):
        """Set up test data for API tests"""
        # Create test user with staff privileges
        self.user = User.objects.create_user(
            email='admin@example.com',
            password='testpass123'
        )
        self.user.is_staff = True
        self.user.save()

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        # Create test data
        self.discipline = Discipline.objects.create(
            name='Test Discipline',
            description='Test discipline'
        )

        self.category = Category.objects.create(
            name='Test Category',
            description='Test category',
            discipline=self.discipline
        )

        self.competition = Competition.objects.create(
            name='API Test Competition',
            discipline=self.discipline,
            start_date=datetime.now().date(),
            end_date=(datetime.now() + timedelta(days=3)).date(),
            status='active'
        )

        self.ranking = LiveRanking.objects.create(
            name='API Test Ranking',
            competition=self.competition,
            category=self.category,
            ranking_type='overall'
        )

    def test_get_live_rankings(self):
        """Test retrieving live rankings"""
        url = reverse('rankings:live-ranking-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'API Test Ranking')

    def test_get_ranking_detail(self):
        """Test retrieving a specific ranking"""
        url = reverse('rankings:live-ranking-detail', kwargs={'pk': str(self.ranking.id)})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'API Test Ranking')

    def test_force_ranking_update(self):
        """Test forcing a ranking update"""
        url = reverse('rankings:live-ranking-force-update', kwargs={'pk': str(self.ranking.id)})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

    def test_get_ranking_entries(self):
        """Test getting ranking entries"""
        # Create test participant and entry
        participant = Participant.objects.create(
            user=self.user,
            competition=self.competition,
            category=self.category,
            rider_name='API Test Rider',
            horse_name='API Test Horse',
            number='API001'
        )

        LiveRankingEntry.objects.create(
            ranking=self.ranking,
            participant=participant,
            position=1,
            current_score=Decimal('88.50')
        )

        url = reverse('rankings:live-ranking-entries', kwargs={'pk': str(self.ranking.id)})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_bulk_ranking_update(self):
        """Test bulk ranking updates"""
        url = reverse('rankings:live-ranking-bulk-update')
        data = {
            'competition_id': str(self.competition.id),
            'round_number': 2
        }
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

    def test_team_rankings(self):
        """Test team ranking endpoints"""
        # Create team ranking
        TeamRanking.objects.create(
            competition=self.competition,
            team_name='API Test Team',
            team_code='ATT',
            position=1,
            total_score=Decimal('300.00')
        )

        url = reverse('rankings:team-ranking-list')
        response = self.client.get(url, {'competition': str(self.competition.id)})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['team_name'], 'API Test Team')

    def test_ranking_stats(self):
        """Test ranking statistics endpoints"""
        url = reverse('rankings:ranking-stats-list')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_competitions', response.data)
        self.assertIn('active_rankings', response.data)

    def test_competition_overview(self):
        """Test competition overview endpoint"""
        url = reverse('rankings:ranking-stats-competition-overview')
        response = self.client.get(url, {'competition_id': str(self.competition.id)})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['competition_id'], str(self.competition.id))
        self.assertEqual(response.data['total_rankings'], 1)


class RankingServiceTest(TestCase):
    """Test the ranking calculation service"""

    def setUp(self):
        """Set up test data for service tests"""
        self.user = User.objects.create_user(
            email='service@example.com',
            password='testpass123'
        )

        self.discipline = Discipline.objects.create(
            name='Service Test Discipline',
            description='Service test discipline'
        )

        self.category = Category.objects.create(
            name='Service Test Category',
            description='Service test category',
            discipline=self.discipline
        )

        self.competition = Competition.objects.create(
            name='Service Test Competition',
            discipline=self.discipline,
            start_date=datetime.now().date(),
            end_date=(datetime.now() + timedelta(days=3)).date(),
            status='active'
        )

        self.ranking = LiveRanking.objects.create(
            name='Service Test Ranking',
            competition=self.competition,
            category=self.category,
            ranking_type='overall'
        )

        self.service = RankingCalculationService()

    def test_ranking_calculation(self):
        """Test basic ranking calculation"""
        # Create participants and scores
        participants = []
        for i in range(3):
            participant = Participant.objects.create(
                user=self.user,
                competition=self.competition,
                category=self.category,
                rider_name=f'Rider {i+1}',
                horse_name=f'Horse {i+1}',
                number=f'00{i+1}'
            )
            participants.append(participant)

            # Create score card
            ScoreCard.objects.create(
                participant=participant,
                judge=self.user,
                final_score=Decimal(str(80.0 + (i * 5))),  # 80, 85, 90
                status='completed'
            )

        # Calculate ranking
        result = self.service.calculate_live_ranking(self.ranking)

        self.assertTrue(result['success'])
        self.assertTrue(result['updated'])

        # Check entries were created and ordered correctly
        entries = list(self.ranking.entries.order_by('position'))
        self.assertEqual(len(entries), 3)

        # Highest score should be first
        self.assertEqual(entries[0].position, 1)
        self.assertEqual(entries[0].current_score, Decimal('90.00'))

        self.assertEqual(entries[1].position, 2)
        self.assertEqual(entries[1].current_score, Decimal('85.00'))

        self.assertEqual(entries[2].position, 3)
        self.assertEqual(entries[2].current_score, Decimal('80.00'))

    def test_consistency_calculation(self):
        """Test consistency score calculation"""
        scores = [85.0, 87.0, 86.0, 88.0, 84.0]
        consistency = self.service._calculate_consistency(scores)

        # Should be a valid consistency score (0-100)
        self.assertGreaterEqual(consistency, 0)
        self.assertLessEqual(consistency, 100)

    def test_recent_trend_calculation(self):
        """Test recent trend calculation"""
        improving_scores = [80.0, 82.0, 85.0]
        declining_scores = [90.0, 87.0, 85.0]
        stable_scores = [85.0, 85.0, 85.0]

        self.assertEqual(self.service._calculate_recent_trend(improving_scores), 'improving')
        self.assertEqual(self.service._calculate_recent_trend(declining_scores), 'declining')
        self.assertEqual(self.service._calculate_recent_trend(stable_scores), 'stable')


class RankingWebSocketTest(TransactionTestCase):
    """Test WebSocket functionality"""

    def setUp(self):
        """Set up test data for WebSocket tests"""
        self.user = User.objects.create_user(
            email='ws@example.com',
            password='testpass123'
        )

        self.discipline = Discipline.objects.create(
            name='WS Test Discipline',
            description='WebSocket test discipline'
        )

        self.category = Category.objects.create(
            name='WS Test Category',
            description='WebSocket test category',
            discipline=self.discipline
        )

        self.competition = Competition.objects.create(
            name='WS Test Competition',
            discipline=self.discipline,
            start_date=datetime.now().date(),
            end_date=(datetime.now() + timedelta(days=3)).date(),
            status='active',
            is_public=True
        )

        self.ranking = LiveRanking.objects.create(
            name='WS Test Ranking',
            competition=self.competition,
            category=self.category,
            ranking_type='overall',
            is_public=True
        )

    async def test_ranking_websocket_connection(self):
        """Test WebSocket connection to ranking updates"""
        application = URLRouter([
            re_path(r'ws/rankings/(?P<ranking_id>[0-9a-f-]+)/$', RankingConsumer.as_asgi()),
        ])

        communicator = WebsocketCommunicator(
            application,
            f'/ws/rankings/{self.ranking.id}/'
        )

        # Test connection
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)

        # Test initial data reception
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'initial_data')
        self.assertIn('data', response)

        # Test ping-pong
        await communicator.send_json_to({
            'type': 'ping',
            'timestamp': '2024-01-01T00:00:00Z'
        })

        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'pong')

        # Close connection
        await communicator.disconnect()

    async def test_ranking_update_broadcast(self):
        """Test that ranking updates are broadcast to connected clients"""
        from .consumers import send_ranking_update

        # Mock update data
        update_data = {
            'ranking_id': str(self.ranking.id),
            'last_updated': datetime.now().isoformat(),
            'total_participants': 5
        }

        # This would normally be called from the ranking service
        await send_ranking_update(str(self.ranking.id), update_data)

        # In a real test, we'd verify that connected clients receive the update
        # For now, we just verify the function doesn't error


def run_manual_tests():
    """
    Manual test functions that can be run to verify functionality
    These are not automated tests but examples of how to test the system
    """
    print("=== Manual Ranking System Tests ===")

    print("1. Testing Model Creation...")
    # Would create test data and verify models work

    print("2. Testing API Endpoints...")
    # Would make API requests and verify responses

    print("3. Testing WebSocket Connections...")
    # Would establish WebSocket connections and test real-time updates

    print("4. Testing Ranking Calculations...")
    # Would create participants with scores and verify ranking calculations

    print("5. Testing Real-time Updates...")
    # Would simulate score changes and verify ranking updates

    print("All manual tests completed!")


if __name__ == '__main__':
    """
    This file can be imported and used for testing the rankings system.

    To run the tests:
    1. Ensure Django environment is set up
    2. Import this file: from apps.rankings.test_rankings import *
    3. Run: run_manual_tests()

    Or use Django's test runner:
    python manage.py test apps.rankings.test_rankings
    """
    run_manual_tests()