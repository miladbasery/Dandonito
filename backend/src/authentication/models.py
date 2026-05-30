from django.db import models


USER_ROLES = (
    ('DOCTOR', 'Doctor'),
    ('ASSISTANT', 'Assistant'),
)
class User(models.Model):

    username = models.CharField(max_length=100 , unique=True)
    password = models.CharField(max_length=128)
    avatar = models.FileField(upload_to="avatar/")
    full_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20 , unique=True)
    is_active = models.BooleanField(default=True)
    clinic = models.ForeignKey('Clinic', on_delete=models.CASCADE , null=True , blank=True)
    role = models.CharField(max_length=20 , choices = USER_ROLES , default = 'DOCTOR')

    def __str__(self):
        return self.username

class Otp(models.Model):
    phone_number = models.CharField(max_length=20)
    otp = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.phone_number
    
class Clinic(models.Model):
    owner = models.ForeignKey('User', on_delete=models.SET_NULL, null=True , related_name='owned_clinics')
    clinic_phone_number = models.CharField(max_length=20)
    clinic_name = models.CharField(max_length=100)
    clinic_province = models.CharField(max_length=100)
    clinic_city = models.CharField(max_length=100)
    clinic_username = models.CharField(max_length=100 , unique=True)
    clinic_address = models.CharField(max_length=100)
    balance = models.IntegerField(default=0)

    def __str__(self):
        return self.clinic_name

