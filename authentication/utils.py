import random
import re
from datetime import timedelta
from django.utils import timezone
from .models import Otp
from rest_framework_simplejwt.tokens import RefreshToken


PHONE_REGEX = re.compile(r'^09\d{9}$')
USERNAME_REGEX = re.compile(r'^[a-zA-Z0-9_]{4,20}$')
PASSWORD_REGEX = re.compile(r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@#$%^&+=]{6,30}$')
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

def generate_otp():
    return str(random.randint(1000, 9999))

def save_otp(phone_number):
    Otp.objects.filter(phone_number=phone_number).delete()

    code = generate_otp()
    Otp.objects.create(
        phone_number=phone_number,
        otp=code,
        created_at=timezone.now()
    )
    print(f"OTP FOR {phone_number}: {code}")
    return code

def verify_otp_code(phone_number, code):
    print(f"Checking Phone: {phone_number}")
    print(f"Checking Code: {code}")

    otp_instance = Otp.objects.filter(phone_number=phone_number).last()
    
    if not otp_instance:
        print("No OTP Found")
        return False
    
    db_code = str(otp_instance.otp).strip()
    input_code = str(code).strip()

    print(f"DB Code: '{db_code}' vs Input Code: '{input_code}'")

    if db_code != input_code:
        print("Code mismatch")
        return False

    if timezone.now() > otp_instance.created_at + timedelta(minutes=2):
        print("OTP Expired")
        otp_instance.delete()
        return False

    otp_instance.delete()
    print("OTP Verified!")
    return True

def can_send_otp(phone_number):
    try:
        otp_instance = Otp.objects.get(phone_number=phone_number)
        if timezone.now() < otp_instance.created_at + timedelta(seconds=10):
            return False
            
    except Otp.DoesNotExist:
        return True
        
    return True

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    #role
    refresh['role'] = user.role
    refresh['full_name'] = user.full_name

    #clinic
    if user.clinic:
        refresh['clinic_id'] = user.clinic.id
        refresh['clinic_username'] = user.clinic.clinic_username
    else:
        refresh['clinic_id'] = None
        refresh['clinic_username'] = None

    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
