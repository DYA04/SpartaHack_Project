from django.urls import path

from . import views

urlpatterns = [
    path('me/', views.me, name='auth-me'),
    path('register/', views.register, name='auth-register'),
    path('login/', views.login, name='auth-login'),
]
