from django.db import models

from core.models import BaseModel
from authentication.models import User
from matching.models import Job


class Conversation(BaseModel):
    """A chat conversation between a volunteer and job poster for a specific job."""
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='conversations')
    volunteer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='volunteer_conversations')
    poster = models.ForeignKey(User, on_delete=models.CASCADE, related_name='poster_conversations')

    class Meta:
        unique_together = ('job', 'volunteer')
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat: {self.volunteer.username} <-> {self.poster.username} for {self.job.title}"


class Message(BaseModel):
    """A single message in a conversation."""
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"
