from django.test import TestCase
from django.utils import timezone

from authentication.models import User
from matching.models import Job, JobCompletion, Badge, UserProfile
from matching.badges import compute_badges, record_completion


class BadgeComputationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com', username='testuser', password='pass123'
        )
        UserProfile.objects.create(user=self.user)

    def _make_job(self, **kwargs):
        defaults = {
            'title': 'Test',
            'description': 'Desc',
            'short_description': 'Short',
            'poster': self.user,
            'latitude': 42.73,
            'longitude': -84.55,
            'shift_start': timezone.now() + timezone.timedelta(hours=2),
            'shift_end': timezone.now() + timezone.timedelta(hours=4),
        }
        defaults.update(kwargs)
        return Job.objects.create(**defaults)

    def test_no_completions_all_level_zero(self):
        badges = compute_badges(self.user)
        for badge in badges:
            self.assertEqual(badge['level'], 0)

    def test_specialist_bronze(self):
        job = self._make_job(skill_tags=['Teaching'])
        JobCompletion.objects.create(
            user=self.user, job=job, completed=True,
            skill_tags_snapshot=['Teaching'],
        )
        badges = compute_badges(self.user)
        specialist = next(b for b in badges if b['track'] == 'specialist')
        self.assertEqual(specialist['level'], 1)  # Bronze

    def test_firefighter_counts_urgent(self):
        for i in range(5):
            job = self._make_job(title=f'Urgent {i}')
            JobCompletion.objects.create(
                user=self.user, job=job, completed=True,
                was_urgent=True,
            )
        badges = compute_badges(self.user)
        firefighter = next(b for b in badges if b['track'] == 'firefighter')
        self.assertEqual(firefighter['level'], 2)  # Silver at 5

    def test_inclusionist_gold_gets_title(self):
        for i in range(5):
            job = self._make_job(
                title=f'Accessible {i}',
                accessibility_requirements=['heavy_lifting'],
            )
            JobCompletion.objects.create(
                user=self.user, job=job, completed=True,
                had_accessibility=True,
            )
        badges = compute_badges(self.user)
        inclusionist = next(b for b in badges if b['track'] == 'inclusionist')
        self.assertEqual(inclusionist['level'], 3)  # Gold
        self.assertEqual(inclusionist['title'], 'Accessibility Champion')

    def test_anchor_levels_by_months(self):
        # Modify user join date to simulate months
        self.user.date_joined = timezone.now() - timezone.timedelta(days=100)
        self.user.save()

        badges = compute_badges(self.user)
        anchor = next(b for b in badges if b['track'] == 'anchor')
        self.assertGreaterEqual(anchor['level'], 2)  # ~3 months = Silver


class RecordCompletionTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com', username='testuser', password='pass123'
        )
        UserProfile.objects.create(user=self.user)

    def test_record_completion_creates_entry(self):
        job = Job.objects.create(
            title='Test',
            description='Desc',
            short_description='Short',
            poster=self.user,
            latitude=42.73,
            longitude=-84.55,
            shift_start=timezone.now() + timezone.timedelta(hours=2),
            shift_end=timezone.now() + timezone.timedelta(hours=4),
            skill_tags=['Teaching'],
            accessibility_requirements=['heavy_lifting'],
        )
        badges = record_completion(self.user, job, completed=True)

        self.assertTrue(
            JobCompletion.objects.filter(user=self.user, job=job, completed=True).exists()
        )
        self.assertIsInstance(badges, list)
        self.assertEqual(len(badges), 4)

    def test_record_drop_updates_stats(self):
        job = Job.objects.create(
            title='Test',
            description='Desc',
            short_description='Short',
            poster=self.user,
            latitude=42.73,
            longitude=-84.55,
            shift_start=timezone.now() + timezone.timedelta(hours=2),
            shift_end=timezone.now() + timezone.timedelta(hours=4),
        )
        record_completion(self.user, job, completed=False)

        profile = UserProfile.objects.get(user=self.user)
        self.assertEqual(profile.jobs_dropped, 1)
        self.assertEqual(profile.jobs_completed, 0)
