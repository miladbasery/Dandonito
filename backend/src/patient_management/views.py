from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Patient, PatientHistory , Reservation , DoctorSchedule
from django.db.models import Q

from .serializers import *
from authentication.authentication import authentication
from datetime import datetime, date, timedelta
from django.db import transaction


class PatientListCreateView(APIView):
    def get(self, request):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        
        if not user.clinic:
            return Response([], status=status.HTTP_200_OK)

        patients = Patient.objects.filter(clinic=user.clinic).order_by('-created_at')
        
        # search_query = request.query_params.get('search', None)
        # if search_query:
        #    patients = patients.filter(
        #        Q(first_name__icontains=search_query) | 
        #        Q(last_name__icontains=search_query) |
        #        Q(phone_number__icontains=search_query) |
        #        Q(national_id__icontains=search_query)
        #    )

        serializer = PatientListSerializer(patients, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])

        if not user.clinic:
            return Response({"error": "Clinic not found"}, status=status.HTTP_400_BAD_REQUEST)
        print("patient created" , request.data)
        serializer = PatientDetailSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(clinic=user.clinic)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        else :
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PatientDetailView(APIView):
    def get_object(self, pk, clinic):
        return get_object_or_404(Patient, pk=pk, clinic=clinic)

    def get(self, request, pk):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        patient = self.get_object(pk, user.clinic)
        
        serializer = PatientDetailSerializer(patient)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])

        patient = self.get_object(pk, user.clinic)
        
        serializer = PatientDetailSerializer(patient, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        patient = self.get_object(pk, user.clinic)
        patient.delete()
        return Response({"message": "Deleted successfully"}, status=status.HTTP_200_OK)

class PatientHistoryCreateView(APIView):
    def post(self, request, pk):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])

        patient = get_object_or_404(Patient, pk=pk, clinic=user.clinic)
        
        serializer = PatientHistorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(patient=patient)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PatientHistoryDetailView(APIView):
    def get_object(self, clinic, patient_id, history_id):
        return get_object_or_404(
            PatientHistory, 
            pk=history_id,
            patient__id=patient_id,
            patient__clinic=clinic
        )

    def get(self, request, patient_id, pk):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])

        history = self.get_object(user.clinic, patient_id, pk)
        serializer = PatientHistorySerializer(history)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, patient_id, pk):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])

        history = self.get_object(user.clinic, patient_id, pk)
        serializer = PatientHistorySerializer(history, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, patient_id, pk):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])

        history = self.get_object(user.clinic, patient_id, pk)
        history.delete()
        return Response({"message": "History deleted successfully"}, status=status.HTTP_200_OK)
    

class DoctorScheduleView(APIView):
    def get(self, request):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        
        if hasattr(user, 'role') and user.role == 'ASSISTANT':
            schedules = DoctorSchedule.objects.filter(user__clinic=user.clinic, date__gte=date.today())
        
        else:
            schedules = DoctorSchedule.objects.filter(user=user, date__gte=date.today())
            
        schedules = schedules.order_by('date')
        serializer = DoctorScheduleSerializer(schedules, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = authentication(request, allowed_roles=['DOCTOR'])
        serializer = DoctorScheduleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class DoctorScheduleDetailView(APIView):
    def get(self, request, pk):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        if hasattr(user, 'role') and user.role == 'ASSISTANT':
            schedule = get_object_or_404(DoctorSchedule, id=pk, user__clinic=user.clinic)
        else:
            schedule = get_object_or_404(DoctorSchedule, id=pk, user=user)
        serializer = DoctorScheduleDetailSerializer(schedule)
        return Response(serializer.data, status=status.HTTP_200_OK)


    def put(self, request, pk):
        user = authentication(request, allowed_roles=['DOCTOR'])
        schedule = get_object_or_404(DoctorSchedule, id=pk, user=user)
        
        serializer = DoctorScheduleSerializer(schedule, data=request.data, partial=True)
        if serializer.is_valid():
            new_start = serializer.validated_data.get('start_time', schedule.start_time)
            new_end = serializer.validated_data.get('end_time', schedule.end_time)
            
            out_of_bounds_reservations = schedule.reservations.filter(
                status__in=['PENDING', 'ACCEPTED']
            ).filter(
                Q(reserved_time_start__lt=new_start) | Q(reserved_time_end__gt=new_end)
            ).exists()

            if out_of_bounds_reservations:
                return Response(
                    {"error": "امکان تغییر ساعت شیفت وجود ندارد زیرا برخی نوبت‌های رزرو شده، خارج از این بازه جدید قرار می‌گیرند."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = authentication(request, allowed_roles=['DOCTOR'])
        schedule = get_object_or_404(DoctorSchedule, id=pk, user=user)
        
        has_active_reservations = schedule.reservations.filter(
            status__in=['PENDING', 'ACCEPTED']
        ).exists()

        if has_active_reservations:
            return Response(
                {"error": "این شیفت دارای نوبت‌های فعال است و قابل حذف نیست. ابتدا نوبت‌ها را کنسل کنید یا تغییر وضعیت دهید."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        schedule.delete()
        return Response({"message": "Schedule deleted successfully"}, status=status.HTTP_200_OK)

class ReserveAppointmentView(APIView):

    def get(self, request):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        
        if hasattr(user, 'role') and user.role == 'ASSISTANT':
            reservations = Reservation.objects.filter(schedule__user__clinic=user.clinic)
        else:
            reservations = Reservation.objects.filter(schedule__user=user)

        schedule_id = request.query_params.get('schedule_id')
        if schedule_id:
            reservations = reservations.filter(schedule_id=schedule_id)
            
        date_param = request.query_params.get('date')
        if date_param:
            reservations = reservations.filter(schedule__date=date_param)

        reservations = reservations.order_by('-created_at')
        serializer = ReservationSerializer(reservations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

    def post(self, request):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        
        serializer = ReserveAppointmentSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            start_time = data['reserved_time_start']
            duration_minutes = data['duration']
            
            dummy_date = date.today()
            start_dt = datetime.combine(dummy_date, start_time)
            end_dt = start_dt + timedelta(minutes=duration_minutes)
            end_time = end_dt.time()

            schedule = get_object_or_404(DoctorSchedule, id=data['schedule_id'])
            
            if not (schedule.start_time <= start_time and end_time <= schedule.end_time):
                 return Response({"error": "زمان انتخاب شده خارج از ساعات حضور پزشک است."}, status=status.HTTP_400_BAD_REQUEST)

            has_overlap = Reservation.objects.filter(
                schedule=schedule,
                reserved_time_start__lt=end_time, 
                reserved_time_end__gt=start_time,
                status__in=['PENDING', 'ACCEPTED'] 
            ).exists()

            if has_overlap:
                return Response({"error": "در این بازه زمانی تداخل وجود دارد (نوبت پر است)."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                with transaction.atomic():
                    patient, created = Patient.objects.get_or_create(
                        phone_number=data['phone_number'],
                        defaults={
                            'first_name': data['first_name'],
                            'last_name': data['last_name'],
                            'national_id': data.get('national_id', ''),
                            'gender': data.get('gender', 'UNKNOWN'),
                            'clinic': schedule.user.clinic
                        }
                    )
  
                    reservation = Reservation.objects.create(
                        schedule=schedule,
                        patient=patient,
                        reserved_time_start=start_time,
                        reserved_time_end=end_time,
                        problem=data.get('problem', ''),
                        status='PENDING'
                    )

                    PatientHistory.objects.create(
                        patient=patient,
                        # reservation=reservation,
                        title=f"رزرو نوبت - {schedule.date}",
                        description=f"ساعت: {start_time} تا {end_time} | مدت: {duration_minutes} دقیقه | علت: {data.get('problem', '---')}"
                    )

                    return Response({
                        "message": "نوبت با موفقیت ثبت شد.",
                        "reservation_id": reservation.id,
                        "patient_new": created,
                        "time_range": f"{start_time} - {end_time}"
                    }, status=status.HTTP_201_CREATED)

            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class ReservationDetailView(APIView):
    def patch(self, request, pk):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        
        reservation = get_object_or_404(Reservation, id=pk, schedule__user__clinic=user.clinic)
        
        serializer = ReservationStatusSerializer(reservation, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "وضعیت نوبت با موفقیت تغییر کرد.", "data": serializer.data}, 
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        
        reservation = get_object_or_404(Reservation, id=pk, schedule__user__clinic=user.clinic)
        reservation.delete()
        
        return Response({"message": "نوبت به طور کامل از سیستم حذف شد."}, status=status.HTTP_200_OK)


class DailyScheduleView(APIView):
    def get(self, request):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        
        target_date = request.query_params.get('date')

        if not target_date:
            return Response(
                {"error": "لطفاً تاریخ را در URL ارسال کنید (مثال: ?date=2026-03-01)"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        schedules = DoctorSchedule.objects.filter(user=user, date=target_date).order_by('start_time')

        serializer = DoctorScheduleDetailSerializer(schedules, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)