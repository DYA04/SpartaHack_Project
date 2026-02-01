import logging

from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .gemini import enhance_job_description
from .image_gen import generate_job_image

logger = logging.getLogger(__name__)

RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW = 3600  # 1 hour

IMAGE_RATE_LIMIT_MAX = 3
IMAGE_RATE_LIMIT_WINDOW = 3600  # 1 hour


def _rate_limit_key(user_id):
    return f"ratelimit:enhance:{user_id}"


def _image_rate_limit_key(user_id):
    return f"ratelimit:image:{user_id}"


def _check_rate_limit(user_id):
    """Returns (allowed: bool, remaining: int)."""
    key = _rate_limit_key(user_id)
    count = cache.get(key, 0)
    if count >= RATE_LIMIT_MAX:
        return False, 0
    return True, RATE_LIMIT_MAX - count - 1


def _increment_rate_limit(user_id):
    key = _rate_limit_key(user_id)
    count = cache.get(key, 0)
    cache.set(key, count + 1, timeout=RATE_LIMIT_WINDOW)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enhance_job(request):
    prompt = request.data.get('prompt', '').strip()

    if not prompt:
        return Response(
            {'error': 'prompt is required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(prompt) > 200:
        return Response(
            {'error': 'prompt must be 200 characters or fewer'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Rate limiting
    allowed, remaining = _check_rate_limit(request.user.id)
    if not allowed:
        return Response(
            {'error': 'Rate limit exceeded. Max 5 requests per hour.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    try:
        result = enhance_job_description(prompt)
    except ValueError as e:
        logger.error(f"Gemini config error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except Exception as e:
        logger.exception("Gemini API call failed")
        return Response(
            {'error': 'AI service temporarily unavailable. Please try again.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    _increment_rate_limit(request.user.id)

    return Response({
        'result': result,
        'remaining_requests': remaining,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_image(request):
    prompt = request.data.get('prompt', '').strip()

    if not prompt:
        return Response(
            {'error': 'prompt is required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(prompt) > 300:
        return Response(
            {'error': 'prompt must be 300 characters or fewer'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Rate limiting (separate from enhance)
    key = _image_rate_limit_key(request.user.id)
    count = cache.get(key, 0)
    if count >= IMAGE_RATE_LIMIT_MAX:
        return Response(
            {'error': 'Rate limit exceeded. Max 3 image requests per hour.'},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    try:
        image_url = generate_job_image(prompt)
    except ValueError as e:
        logger.error(f"Image gen config error: {e}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except Exception as e:
        logger.exception("Image generation failed")
        return Response(
            {'error': 'Image generation temporarily unavailable. Please try again.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    cache.set(key, count + 1, timeout=IMAGE_RATE_LIMIT_WINDOW)

    # Build absolute URL so the frontend (different origin) can reach the file
    absolute_url = request.build_absolute_uri(image_url)
    return Response({'image_url': absolute_url})
