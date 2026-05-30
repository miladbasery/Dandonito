from django.urls import path
from .views import *

urlpatterns = [
    path('patients/', PatientListCreateView.as_view()),
    path('patients/<int:pk>/', PatientDetailView.as_view()),
    path('patients/<int:pk>/history/', PatientHistoryCreateView.as_view()), 
    path('patients/<int:patient_id>/history/<int:pk>/', PatientHistoryDetailView.as_view()),

    path('schedule/', DoctorScheduleView.as_view()),
    path('schedule/<int:pk>/', DoctorScheduleDetailView.as_view()),
    path('schedule/daily/', DailyScheduleView.as_view()),

    path('reserve/', ReserveAppointmentView.as_view()),
    path('reserve/<int:pk>/', ReservationDetailView.as_view()),

]   