from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from authentication.models import User
from matching.models import Job


class JobCreateTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='poster@example.com', username='poster', password='StrongPass123!'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_job_success(self):
        response = self.client.post('/api/matching/jobs/create', {
            'title': 'Test Job',
            'description': 'A test job description.',
            'short_description': 'Test short desc',
            'skill_tags': ['Teaching', 'Cooking'],
            'accessibility_flags': {'heavy_lifting': True, 'standing_long': False},
            'latitude': 42.73,
            'longitude': -84.55,
            'shift_start': (timezone.now() + timezone.timedelta(hours=24)).isoformat(),
            'shift_end': (timezone.now() + timezone.timedelta(hours=26)).isoformat(),
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Test Job')
        self.assertIn('heavy_lifting', response.data['accessibility_requirements'])
        self.assertNotIn('standing_long', response.data['accessibility_requirements'])

    def test_create_job_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.post('/api/matching/jobs/create', {
            'title': 'Test Job',
            'description': 'Desc',
            'short_description': 'Short',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_accessibility_flag_conversion(self):
        response = self.client.post('/api/matching/jobs/create', {
            'title': 'Accessible Job',
            'description': 'Test',
            'short_description': 'Short',
            'accessibility_flags': {
                'heavy_lifting': True,
                'driving_required': True,
                'standing_long': False,
                'outdoor_work': False,
            },
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        reqs = response.data['accessibility_requirements']
        self.assertIn('heavy_lifting', reqs)
        self.assertIn('driving_required', reqs)
        self.assertNotIn('standing_long', reqs)
        self.assertNotIn('outdoor_work', reqs)


class JobUpdateDeleteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='poster@example.com', username='poster', password='StrongPass123!'
        )
        self.other = User.objects.create_user(
            email='other@example.com', username='other', password='StrongPass123!'
        )
        self.client.force_authenticate(user=self.user)
        self.job = Job.objects.create(
            title='Original Title',
            description='Desc',
            short_description='Short',
            poster=self.user,
            latitude=42.73,
            longitude=-84.55,
            shift_start=timezone.now() + timezone.timedelta(hours=24),
            shift_end=timezone.now() + timezone.timedelta(hours=26),
        )

    def test_update_own_job(self):
        response = self.client.patch(
            f'/api/matching/jobs/{self.job.id}/update',
            {'title': 'Updated Title'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Title')

    def test_update_others_job_forbidden(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.patch(
            f'/api/matching/jobs/{self.job.id}/update',
            {'title': 'Hacked'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_job(self):
        response = self.client.delete(f'/api/matching/jobs/{self.job.id}/delete')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.job.refresh_from_db()
        self.assertFalse(self.job.is_active)

    def test_delete_others_job_forbidden(self):
        self.client.force_authenticate(user=self.other)
        response = self.client.delete(f'/api/matching/jobs/{self.job.id}/delete')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class MyPostedJobsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='poster@example.com', username='poster', password='StrongPass123!'
        )
        self.client.force_authenticate(user=self.user)
        Job.objects.create(
            title='My Job',
            description='Desc',
            short_description='Short',
            poster=self.user,
            latitude=42.73,
            longitude=-84.55,
            shift_start=timezone.now() + timezone.timedelta(hours=24),
            shift_end=timezone.now() + timezone.timedelta(hours=26),
        )

    def test_list_my_posted_jobs(self):
        response = self.client.get('/api/matching/jobs/my-posted')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'My Job')
