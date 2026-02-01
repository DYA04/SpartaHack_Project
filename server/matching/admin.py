from django.contrib import admin

from .models import Job, UserProfile, MatchingInterest, Badge, JobCompletion, JobAcceptance

admin.site.register(Job)
admin.site.register(UserProfile)
admin.site.register(MatchingInterest)
admin.site.register(Badge)
admin.site.register(JobCompletion)
admin.site.register(JobAcceptance)
