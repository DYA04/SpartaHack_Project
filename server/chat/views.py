from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.db.models import Q

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer, SendMessageSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_conversations(request):
    """List all conversations for the current user (as volunteer or poster)."""
    conversations = Conversation.objects.filter(
        Q(volunteer=request.user) | Q(poster=request.user),
        is_active=True,
    ).select_related('job', 'volunteer', 'poster').prefetch_related('messages')

    data = ConversationSerializer(conversations, many=True).data
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, conversation_id):
    """Get all messages for a conversation."""
    try:
        conversation = Conversation.objects.get(
            id=conversation_id,
            is_active=True,
        )
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

    # Ensure user is part of the conversation
    if request.user != conversation.volunteer and request.user != conversation.poster:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    messages = conversation.messages.select_related('sender').all()
    data = MessageSerializer(messages, many=True).data

    return Response({
        'conversation': ConversationSerializer(conversation).data,
        'messages': data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, conversation_id):
    """Send a message to a conversation."""
    try:
        conversation = Conversation.objects.get(
            id=conversation_id,
            is_active=True,
        )
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

    # Ensure user is part of the conversation
    if request.user != conversation.volunteer and request.user != conversation.poster:
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

    serializer = SendMessageSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    message = Message.objects.create(
        conversation=conversation,
        sender=request.user,
        content=serializer.validated_data['content'],
    )

    # Update conversation's updated_at to sort by most recent activity
    conversation.save()

    return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversation_by_job(request, job_id):
    """Get or return info about a conversation for a specific job."""
    try:
        conversation = Conversation.objects.get(
            Q(volunteer=request.user) | Q(poster=request.user),
            job_id=job_id,
            is_active=True,
        )
        return Response(ConversationSerializer(conversation).data)
    except Conversation.DoesNotExist:
        return Response({'error': 'No conversation found for this job'}, status=status.HTTP_404_NOT_FOUND)
