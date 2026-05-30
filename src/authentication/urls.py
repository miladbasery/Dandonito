from django.urls import path
from .views import *

urlpatterns = [
    path('register/request/', RegisterRequestView.as_view()),
    path('register/verify/', RegisterVerifyView.as_view()),
    path('login/request/', LoginRequestView.as_view()),
    path('login/verify/', LoginVerifyView.as_view()),
    
    path('assistants/', AssistantManagerView.as_view()),
    path('assistants/<int:pk>/', AssistantDetailView.as_view()),

    path('profile/', UserProfileView.as_view()),
    path('profile/change-phone/request/', RequestChangePhoneView.as_view()),
    path('profile/change-phone/verify/', VerifyChangePhoneView.as_view()),
    path('profile/change-password/', ChangePasswordView.as_view()),

    path('show/', ShowUserView.as_view()),
    path('activate/<int:pk>/', AssistantActivateView.as_view()),
]