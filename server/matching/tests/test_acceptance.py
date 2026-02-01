from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from authentication.models import User
from matching.models import Job, MatchingInterest, JobAcceptance


class AcceptVolunteerTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.poster = User.objects.create_user(
            email='poster@example.com', username='poster', password='StrongPass123!'
        )
        self.volunteer = User.objects.create_user(
            email='vol@example.com', username='volunteer', password='StrongPass123!'
        )
        self.job = Job.objects.create(
            title='Test Job',
            description='Desc',
            short_description='Short',
            poster=self.poster,
            latitude=42.73,
            longitude=-84.55,
            shift_start=timezone.now() + timezone.timedelta(hours=24),
            shift_end=timezone.now() + timezone.timedelta(hours=26),
        )
        # Volunteer expresses interest
        MatchingInterest.objects.create(
            user=self.volunteer, job=self.job, interested=True
        )

    def test_accept_volunteer_success(self):
        self.client.force_authenticate(user=self.poster)
        response = self.client.post(
            f'/api/matching/jobs/{self.job.id}/accept',
            {'user_id': self.volunteer.id},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            JobAcceptance.objects.filter(user=self.volunteer, job=self.job).exists()
        )

    def test_accept_only_poster_can_accept(self):
        self.client.force_authenticate(user=self.volunteer)
        response = self.client.post(
            f'/api/matching/jobs/{self.job.id}/accept',
            {'user_id': self.volunteer.id},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_accept_must_have_interest(self):
        other = User.objects.create_user(
            email='other@example.com', username='other', password='StrongPass123!'
        )
        self.client.force_authenticate(user=self.poster)
        response = self.client.post(
            f'/api/matching/jobs/{self.job.id}/accept',
            {'user_id': other.id},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accept_duplicate_rejected(self):
        self.client.force_authenticate(user=self.poster)
        self.client.post(
            f'/api/matching/jobs/{self.job.id}/accept',
            {'user_id': self.volunteer.id},
            format='json',
        )
        response = self.client.post(
            f'/api/matching/jobs/{self.job.id}/accept',
            {'user_id': self.volunteer.id},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class InterestedUsersTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.poster = User.objects.create_user(
            email='poster@example.com', username='poster', password='StrongPass123!'
        )
        self.vol1 = User.objects.create_user(
            email='vol1@example.com', username='vol1', password='StrongPass123!'
        )
        self.vol2 = User.objects.create_user(
            email='vol2@example.com', username='vol2', password='StrongPass123!'
        )
        self.job = Job.objects.create(
            title='Test Job',
            description='Desc',
            short_description='Short',
            poster=self.poster,
            latitude=42.73,
            longitude=-84.55,
            shift_start=timezone.now() + timezone.timedelta(hours=24),
            shift_end=timezone.now() + timezone.timedelta(hours=26),
        )
        MatchingInterest.objects.create(user=self.vol1, job=self.job, interested=True)
        MatchingInterest.objects.create(user=self.vol2, job=self.job, interested=True)

    def test_poster_can_view_interested_users(self):
        self.client.force_authenticate(user=self.poster)
        response = self.client.get(f'/api/matching/jobs/{self.job.id}/interested')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_non_poster_cannot_view_interested_users(self):
        self.client.force_authenticate(user=self.vol1)
        response = self.client.get(f'/api/matching/jobs/{self.job.id}/interested')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class MyAcceptedJobsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.poster = User.objects.create_user(
            email='poster@example.com', username='poster', password='StrongPass123!'
        )
        self.volunteer = User.objects.create_user(
            email='vol@example.com', username='volunteer', password='StrongPass123!'
        )
        self.job = Job.objects.create(
            title='Test Job',
            description='Desc',
            short_description='Short',
            poster=self.poster,
            latitude=42.73,
            longitude=-84.55,
            shift_start=timezone.now() + timezone.timedelta(hours=24),
            shift_end=timezone.now() + timezone.timedelta(hours=26),
        )
        JobAcceptance.objects.create(user=self.volunteer, job=self.job)

    def test_my_accepted_jobs(self):
        self.client.force_authenticate(user=self.volunteer)
        response = self.client.get('/api/matching/jobs/accepted')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
