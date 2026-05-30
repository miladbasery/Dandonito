from rest_framework import serializers
from .models import Patient, PatientHistory , DoctorSchedule , Reservation
from datetime import datetime, date, timedelta

class PatientHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientHistory
        fields = ['id', 'title', 'description', 'created_at']

class PatientListSerializer(serializers.ModelSerializer):
    has_history = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id', 
            'first_name', 
            'last_name', 
            'phone_number', 
            'national_id', 
            'age', 
            'gender', 
            'blood_group', 
            'created_at',
            'has_history' 
        ]

    def get_has_history(self, obj):
        return obj.patienthistory_set.exists()

class PatientDetailSerializer(serializers.ModelSerializer):
    history = PatientHistorySerializer(many=True, read_only=True, source='patienthistory_set')

    class Meta:
        model = Patient
        fields = [
            'id', 
            'first_name', 
            'last_name', 
            'phone_number', 
            'national_id', 
            'age', 
            'gender', 
            'blood_group', 
            'created_at',
            'history' 
        ]

class ReservationSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    phone_number = serializers.CharField(source='patient.phone_number', read_only=True)

    class Meta:
        model = Reservation
        fields = ['id', 'patient_name', 'phone_number', 'reserved_time_start', 'reserved_time_end', 'duration', 'status']

    def get_patient_name(self, obj):
        return f"{obj.patient.first_name} {obj.patient.last_name}"

class DoctorScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorSchedule
        fields = ['id', 'date', 'start_time', 'end_time', 'duration', 'is_active', 'description']

class DoctorScheduleDetailSerializer(serializers.ModelSerializer):
    reservations = ReservationSerializer(many=True, read_only=True) 
    available_slots = serializers.SerializerMethodField()

    class Meta:
        model = DoctorSchedule
        fields = ['id', 'date', 'start_time', 'end_time', 'duration', 'is_active', 'description', 'available_slots', 'reservations']

    def get_available_slots(self, obj):
        if not obj.is_active:
            return []

        dummy_date = date.today()
        current_dt = datetime.combine(dummy_date, obj.start_time)
        end_dt = datetime.combine(dummy_date, obj.end_time)
        step = timedelta(minutes=obj.duration)

        active_reservations = obj.reservations.filter(status__in=['PENDING', 'ACCEPTED'])
        
        slots = []
        
        while current_dt + step <= end_dt:
            slot_start = current_dt.time()
            slot_end = (current_dt + step).time()
            
            is_overlapping = False
            for res in active_reservations:
                if res.reserved_time_start < slot_end and res.reserved_time_end > slot_start:
                    is_overlapping = True
                    break
            
            if not is_overlapping:
                slots.append(slot_start.strftime('%H:%M'))
                
            current_dt += step
            
        return slots

class ReserveAppointmentSerializer(serializers.Serializer):
    schedule_id = serializers.IntegerField()
    reserved_time_start = serializers.TimeField()
    duration = serializers.IntegerField(default=30) 
    problem = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    phone_number = serializers.CharField(max_length=20)
    national_id = serializers.CharField(max_length=20, required=False, allow_blank=True)
    gender = serializers.CharField(max_length=10, required=False)

class ReservationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = ['status']