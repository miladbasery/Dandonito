from django.db import models
from authentication.models import User , Clinic
from datetime import datetime, date


class Patient(models.Model):
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE , related_name='patients')
    phone_number = models.CharField(max_length=100 , unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    national_id = models.CharField(max_length=100, unique=True) 
    age = models.IntegerField(default=0)
    gender = models.CharField(max_length=100)
    blood_group = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.phone_number
    

class PatientHistory(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    description = models.TextField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.patient
    
class HistoryAttachment(models.Model):
    patient_history = models.ForeignKey(PatientHistory, on_delete=models.CASCADE)
    attachment = models.FileField(upload_to='medical_history/')
    title = models.CharField(max_length=100)


class DoctorSchedule(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='schedules')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    duration = models.IntegerField(default=30)
    description = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'date')

    def __str__(self):
        return f"{self.user.full_name} | {self.date} ({self.start_time} - {self.end_time})"


class Reservation(models.Model):
    RESERVED_STATUS = (
        ('PENDING', 'در انتظار'),
        ('ACCEPTED', 'تایید شده'),
        ('REJECTED', 'رد شده'),
        ('DONE', 'انجام شده'),
        ('CANCELLED', 'کنسل شده'),
        ('ABSENT', 'غایب'),
    )

    schedule = models.ForeignKey(DoctorSchedule, on_delete=models.CASCADE, related_name='reservations')
    patient = models.ForeignKey('Patient', on_delete=models.CASCADE, related_name='reservations')
    
    reserved_time_start = models.TimeField()
    reserved_time_end = models.TimeField()
    duration = models.IntegerField(default=0, editable=False)
    
    problem = models.TextField(null=True, blank=True)
    price = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=RESERVED_STATUS, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.reserved_time_start and self.reserved_time_end:
            dummy_date = date.today()
            start_dt = datetime.combine(dummy_date, self.reserved_time_start)
            end_dt = datetime.combine(dummy_date, self.reserved_time_end)
            
            diff = end_dt - start_dt
            self.duration = int(diff.total_seconds() / 60)
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient} | {self.reserved_time_start} - {self.reserved_time_end} ({self.duration} mins)"