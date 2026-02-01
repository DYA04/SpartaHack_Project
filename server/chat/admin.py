from django.contrib import admin

from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'job', 'volunteer', 'poster', 'created_at']
    list_filter = ['created_at']
    search_fields = ['job__title', 'volunteer__username', 'poster__username']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'sender', 'content_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'sender__username']

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'
