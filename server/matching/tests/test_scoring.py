from django.test import TestCase
from django.utils import timezone

from authentication.models import User
from matching.models import Job, UserProfile
from matching.scoring import calculate_score, haversine_distance


class HaversineTests(TestCase):
    def test_same_point(self):
        dist = haversine_distance(42.73, -84.55, 42.73, -84.55)
        self.assertAlmostEqual(dist, 0, places=5)

    def test_known_distance(self):
        # East Lansing to Detroit (~80 miles)
        dist = haversine_distance(42.7370, -84.4839, 42.3314, -83.0458)
        self.assertTrue(70 < dist < 95)

    def test_symmetry(self):
        d1 = haversine_distance(42.73, -84.55, 42.33, -83.05)
        d2 = haversine_distance(42.33, -83.05, 42.73, -84.55)
        self.assertAlmostEqual(d1, d2, places=5)


class ScoringTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com', username='testuser', password='pass123'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            latitude=42.73,
            longitude=-84.55,
            skill_tags=['Teaching', 'Cooking'],
        )

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
            'skill_tags': [],
            'accessibility_requirements': [],
        }
        defaults.update(kwargs)
        return Job.objects.create(**defaults)

    def test_nearby_job_scores_positive(self):
        job = self._make_job()
        score, distance = calculate_score(self.profile, job, radius=25)
        self.assertGreater(score, 0)

    def test_far_away_job_scores_zero(self):
        job = self._make_job(latitude=30.0, longitude=-90.0)
        score, distance = calculate_score(self.profile, job, radius=25)
        self.assertEqual(score, 0)

    def test_skill_overlap_increases_score(self):
        job_no_skills = self._make_job(skill_tags=[])
        job_matching = self._make_job(skill_tags=['Teaching', 'Cooking'])
        job_no_match = self._make_job(skill_tags=['Programming'])

        score_no_skills, _ = calculate_score(self.profile, job_no_skills)
        score_matching, _ = calculate_score(self.profile, job_matching)
        score_no_match, _ = calculate_score(self.profile, job_no_match)

        # Perfect skill match should score higher than no match
        self.assertGreater(score_matching, score_no_match)

    def test_urgent_job_scores_higher(self):
        urgent_job = self._make_job(
            shift_start=timezone.now() + timezone.timedelta(hours=2),
        )
        non_urgent_job = self._make_job(
            shift_start=timezone.now() + timezone.timedelta(hours=72),
        )
        score_urgent, _ = calculate_score(self.profile, urgent_job)
        score_non_urgent, _ = calculate_score(self.profile, non_urgent_job)
        self.assertGreater(score_urgent, score_non_urgent)

    def test_reliability_factor(self):
        self.profile.jobs_completed = 10
        self.profile.jobs_dropped = 0
        self.profile.save()
        job = self._make_job()
        score_reliable, _ = calculate_score(self.profile, job)

        self.profile.jobs_completed = 1
        self.profile.jobs_dropped = 9
        self.profile.save()
        score_unreliable, _ = calculate_score(self.profile, job)

        self.assertGreater(score_reliable, score_unreliable)

    def test_accessibility_filter(self):
        self.profile.limitations = ['heavy_lifting']
        self.profile.save()

        job_conflict = self._make_job(accessibility_requirements=['heavy_lifting'])
        job_ok = self._make_job(accessibility_requirements=['driving_required'])

        score_conflict, _ = calculate_score(self.profile, job_conflict)
        score_ok, _ = calculate_score(self.profile, job_ok)

        self.assertEqual(score_conflict, 0)
        self.assertGreater(score_ok, 0)

    def test_no_location_user(self):
        self.profile.latitude = None
        self.profile.longitude = None
        self.profile.save()
        job = self._make_job()
        score, distance = calculate_score(self.profile, job)
        self.assertGreater(score, 0)  # Should still score (half distance points)
