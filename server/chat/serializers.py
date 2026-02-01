from rest_framework import serializers

from .models import Conversation, Message
from matching.serializers import JobMatchSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender_id', 'sender_username', 'content', 'created_at']
        read_only_fields = ['id', 'conversation', 'sender_id', 'sender_username', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    job = JobMatchSerializer(read_only=True)
    volunteer_username = serializers.CharField(source='volunteer.username', read_only=True)
    volunteer_id = serializers.IntegerField(source='volunteer.id', read_only=True)
    poster_username = serializers.CharField(source='poster.username', read_only=True)
    poster_id = serializers.IntegerField(source='poster.id', read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'job', 'volunteer_id', 'volunteer_username',
            'poster_id', 'poster_username', 'last_message', 'unread_count',
            'created_at', 'updated_at'
        ]

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if last:
            return {
                'content': last.content[:100],
                'sender_username': last.sender.username,
                'created_at': last.created_at,
            }
        return None

    def get_unread_count(self, obj):
        # For simplicity, return 0. In a real app, track read status per user
        return 0


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=2000)
