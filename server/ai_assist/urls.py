from django.urls import path

from . import views

urlpatterns = [
    path('enhance-job', views.enhance_job, name='ai-enhance-job'),
    path('generate-image', views.generate_image, name='ai-generate-image'),
]
