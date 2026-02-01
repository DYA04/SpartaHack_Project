from django.urls import path

from . import views

urlpatterns = [
    path('conversations', views.list_conversations, name='list-conversations'),
    path('conversations/<uuid:conversation_id>/messages', views.get_messages, name='get-messages'),
    path('conversations/<uuid:conversation_id>/send', views.send_message, name='send-message'),
    path('job/<uuid:job_id>/conversation', views.get_conversation_by_job, name='job-conversation'),
]
