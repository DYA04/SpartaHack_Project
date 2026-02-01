"""
Management command to create demo/test accounts with sample data.

Usage:
    python manage.py seed_demo

Creates:
    - volunteer@test.com (password: test1234)
    - poster@test.com (password: test1234)
    - Sample jobs in various states
    - Sample chat messages
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from authentication.models import User
from matching.models import Job, UserProfile, MatchingInterest, JobAcceptance
from chat.models import Conversation, Message


class Command(BaseCommand):
    help = 'Create demo accounts and sample data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Creating demo accounts and data...')

        # Create or get volunteer user
        volunteer, v_created = User.objects.get_or_create(
            email='volunteer@test.com',
            defaults={
                'username': 'volunteer_demo',
                'first_name': 'Demo',
                'last_name': 'Volunteer',
            }
        )
        if v_created:
            volunteer.set_password('test1234')
            volunteer.save()
            self.stdout.write(self.style.SUCCESS(f'Created volunteer@test.com'))
        else:
            self.stdout.write(f'volunteer@test.com already exists')

        # Create volunteer profile
        volunteer_profile, _ = UserProfile.objects.get_or_create(
            user=volunteer,
            defaults={
                'latitude': 42.7325,
                'longitude': -84.5555,
                'skill_tags': ['Moving', 'Tech Help', 'Driving'],
            }
        )

        # Create or get poster user
        poster, p_created = User.objects.get_or_create(
            email='poster@test.com',
            defaults={
                'username': 'poster_demo',
                'first_name': 'Demo',
                'last_name': 'Poster',
            }
        )
        if p_created:
            poster.set_password('test1234')
            poster.save()
            self.stdout.write(self.style.SUCCESS(f'Created poster@test.com'))
        else:
            self.stdout.write(f'poster@test.com already exists')

        # Create poster profile
        poster_profile, _ = UserProfile.objects.get_or_create(
            user=poster,
            defaults={
                'latitude': 42.7340,
                'longitude': -84.5500,
            }
        )

        # Create sample jobs
        now = timezone.now()

        # Job 1: Pending (volunteer swiped, waiting poster confirmation)
        job1, _ = Job.objects.get_or_create(
            title='Help Moving Furniture',
            poster=poster,
            defaults={
                'description': 'I need help moving some furniture from my old apartment to a new one. The new place is about 2 miles away. I have a truck but need someone to help carry the heavy stuff.',
                'short_description': 'Moving furniture to new apartment, about 2 miles away.',
                'latitude': 42.7350,
                'longitude': -84.5510,
                'shift_start': now + timedelta(days=2),
                'shift_end': now + timedelta(days=2, hours=4),
                'skill_tags': ['Moving', 'Heavy Lifting'],
                'accessibility_requirements': ['heavy_lifting'],
                'status': 'open',
            }
        )

        # Create pending acceptance for job1
        MatchingInterest.objects.get_or_create(
            user=volunteer,
            job=job1,
            defaults={'interested': True}
        )
        JobAcceptance.objects.get_or_create(
            user=volunteer,
            job=job1,
            defaults={'status': 'pending'}
        )

        # Job 2: Confirmed (with chat history)
        job2, _ = Job.objects.get_or_create(
            title='Tech Help - Computer Setup',
            poster=poster,
            defaults={
                'description': 'I just got a new computer and need help setting it up. This includes transferring files from my old computer, installing software, and showing me how to use some basic features.',
                'short_description': 'Need help setting up new computer and transferring files.',
                'latitude': 42.7320,
                'longitude': -84.5530,
                'shift_start': now + timedelta(days=1),
                'shift_end': now + timedelta(days=1, hours=2),
                'skill_tags': ['Tech Help'],
                'accessibility_requirements': [],
                'status': 'open',
            }
        )

        # Create confirmed acceptance for job2
        MatchingInterest.objects.get_or_create(
            user=volunteer,
            job=job2,
            defaults={'interested': True}
        )
        acceptance2, _ = JobAcceptance.objects.get_or_create(
            user=volunteer,
            job=job2,
            defaults={'status': 'confirmed'}
        )
        # Ensure status is confirmed
        acceptance2.status = 'confirmed'
        acceptance2.save()

        # Create conversation and messages for job2
        conversation, _ = Conversation.objects.get_or_create(
            job=job2,
            volunteer=volunteer,
            defaults={'poster': poster}
        )

        # Add sample messages
        messages_data = [
            (poster, 'Hi! Thanks for accepting to help. When would be a good time to meet?'),
            (volunteer, 'Hello! I\'m free tomorrow afternoon after 2pm. Does that work for you?'),
            (poster, 'That works great! I\'ll text you my address. See you then!'),
            (volunteer, 'Perfect, looking forward to helping out!'),
        ]

        for i, (sender, content) in enumerate(messages_data):
            Message.objects.get_or_create(
                conversation=conversation,
                sender=sender,
                content=content,
                defaults={
                    'created_at': now - timedelta(hours=len(messages_data) - i)
                }
            )

        # Job 3: Completed
        job3, _ = Job.objects.get_or_create(
            title='Grocery Shopping Assistance',
            poster=poster,
            defaults={
                'description': 'I injured my leg and need help getting groceries this week. Just need someone to drive me to the store and help carry bags.',
                'short_description': 'Help with grocery shopping due to leg injury.',
                'latitude': 42.7300,
                'longitude': -84.5480,
                'shift_start': now - timedelta(days=3),
                'shift_end': now - timedelta(days=3, hours=-2),
                'skill_tags': ['Driving', 'Errands'],
                'accessibility_requirements': ['driving_required'],
                'status': 'filled',
            }
        )

        # Create completed acceptance for job3
        MatchingInterest.objects.get_or_create(
            user=volunteer,
            job=job3,
            defaults={'interested': True}
        )
        acceptance3, _ = JobAcceptance.objects.get_or_create(
            user=volunteer,
            job=job3,
            defaults={'status': 'completed'}
        )
        acceptance3.status = 'completed'
        acceptance3.save()

        # Create an additional open job from poster (for testing matching)
        job4, _ = Job.objects.get_or_create(
            title='Dog Walking',
            poster=poster,
            defaults={
                'description': 'I\'m going out of town for the weekend and need someone to walk my dog twice a day. He\'s a friendly golden retriever named Max.',
                'short_description': 'Weekend dog walking for friendly golden retriever.',
                'latitude': 42.7330,
                'longitude': -84.5520,
                'shift_start': now + timedelta(days=5),
                'shift_end': now + timedelta(days=7),
                'skill_tags': ['Pet Care'],
                'accessibility_requirements': ['outdoor_work'],
                'status': 'open',
            }
        )

        self.stdout.write(self.style.SUCCESS('\nDemo data created successfully!'))
        self.stdout.write('\nTest accounts:')
        self.stdout.write('  - volunteer@test.com / test1234')
        self.stdout.write('  - poster@test.com / test1234')
        self.stdout.write('\nSample jobs:')
        self.stdout.write(f'  - "{job1.title}" (pending)')
        self.stdout.write(f'  - "{job2.title}" (confirmed with chat)')
        self.stdout.write(f'  - "{job3.title}" (completed)')
        self.stdout.write(f'  - "{job4.title}" (open, no volunteer yet)')
