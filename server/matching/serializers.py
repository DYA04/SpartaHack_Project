from rest_framework import serializers

from .models import Job, UserProfile, MatchingInterest, JobAcceptance


class JobMatchSerializer(serializers.ModelSerializer):
    is_urgent = serializers.BooleanField(read_only=True)
    distance = serializers.FloatField(read_only=True)
    score = serializers.FloatField(read_only=True)
    poster_username = serializers.CharField(source='poster.username', read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'short_description', 'description',
            'skill_tags', 'latitude', 'longitude',
            'shift_start', 'shift_end', 'is_urgent',
            'distance', 'score', 'poster_username',
            'accessibility_requirements', 'status',
        ]


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['latitude', 'longitude', 'skill_tags', 'limitations']


class BadgeSerializer(serializers.Serializer):
    track = serializers.CharField()
    level = serializers.IntegerField()
    level_name = serializers.CharField()
    progress = serializers.IntegerField()
    next_threshold = serializers.IntegerField(allow_null=True)
    title = serializers.CharField(allow_blank=True)
    description = serializers.CharField()


class JobCompletionSerializer(serializers.Serializer):
    job_id = serializers.UUIDField()
    completed = serializers.BooleanField(default=True)


class MatchingInterestSerializer(serializers.Serializer):
    job_id = serializers.UUIDField()
    interested = serializers.BooleanField()


class JobCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    short_description = serializers.CharField(max_length=200)
    skill_tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    accessibility_flags = serializers.DictField(required=False, default=dict)
    latitude = serializers.FloatField(required=False, default=0.0)
    longitude = serializers.FloatField(required=False, default=0.0)
    shift_start = serializers.DateTimeField(required=False, allow_null=True, default=None)
    shift_end = serializers.DateTimeField(required=False, allow_null=True, default=None)

    def validate(self, data):
        if data.get('shift_start') and data.get('shift_end'):
            if data['shift_end'] <= data['shift_start']:
                raise serializers.ValidationError('shift_end must be after shift_start.')
        return data


class JobAcceptanceSerializer(serializers.ModelSerializer):
    job = JobMatchSerializer(read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = JobAcceptance
        fields = ['id', 'job', 'username', 'status', 'created_at']


class AcceptVolunteerSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()


class InterestedUserSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(source='user.id')
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    interested_at = serializers.DateTimeField(source='created_at')
