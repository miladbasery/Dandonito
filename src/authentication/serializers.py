from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import User, Clinic
from rest_framework.response import Response
from rest_framework import status
from .utils import USERNAME_REGEX, PASSWORD_REGEX, PHONE_REGEX , EMAIL_REGEX

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=100)
    password = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(max_length=20)
    email = serializers.CharField(max_length=100)
    full_name = serializers.CharField(max_length=100)
    clinic_name = serializers.CharField(max_length=100)
    clinic_username = serializers.CharField(max_length=100)

    def check_user_status(self, field, value):
        user = User.objects.filter(**{field: value}).first()
        if user:
            if not user.is_active:
                raise serializers.ValidationError(
                    f"this account : {field} is not active , please call the administrator to activate your account"
                )
            raise serializers.ValidationError(f"this account : {field} already registered")
        
    def validate_username(self, value):
        self.check_user_status('username', value)
        if not USERNAME_REGEX.match(value):
            raise serializers.ValidationError("Invalid username format")
        return value

    def validate_email(self, value):
        self.check_user_status('email', value)
        if not EMAIL_REGEX.match(value):
            raise serializers.ValidationError("Invalid email format")
        return value

    def validate_phone_number(self, value):
        self.check_user_status('phone_number', value)
        if not PHONE_REGEX.match(value):
            raise serializers.ValidationError("Invalid phone format")
        return value

    def validate_password(self, value):
        if not PASSWORD_REGEX.match(value):
            raise serializers.ValidationError("Password is weak")
        return make_password(value)

    def validate_clinic_username(self, value):
        if not USERNAME_REGEX.match(value):
            raise serializers.ValidationError("Invalid clinic username format")
        if Clinic.objects.filter(clinic_username=value).exists():
            raise serializers.ValidationError("Clinic username already registered")
        return value

class LoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True)

class VerifyOtpSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    otp = serializers.CharField(max_length=4)

class UserShowSerializer(serializers.ModelSerializer):
    clinic_name = serializers.CharField(source='clinic.clinic_name', read_only=True)
    clinic_username = serializers.CharField(source='clinic.clinic_username', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'is_active' , 'username', 'full_name', 'phone_number', 'email', 'role', 'clinic_name', 'clinic_username' , 'password']

class AssistantListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'phone_number', 'email', 'role', 'username']

class CreateAssistantSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'full_name', 'phone_number' ,'email' , 'role']
    
class UpdateAssistantSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'full_name', 'phone_number' , 'email' , 'role'] 
  
class RegisterVerifySerializer(serializers.ModelSerializer):
    otp = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True)
    clinic_name = serializers.CharField(required=True)
    clinic_username = serializers.CharField(required=True)
    clinic_phone_number = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = [ 'username', 'password', 'full_name', 'phone_number', 'otp', 'clinic_name', 'clinic_username', 'clinic_phone_number' , 'email']

class ChangePhoneRequestSerializer(serializers.Serializer):
    new_phone_number = serializers.CharField(max_length=20)
    
    def validate_new_phone_number(self, value):
        if not PHONE_REGEX.match(value):
            raise serializers.ValidationError("Invalid phone number format.")
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("This phone number already registered.")
        return value

class ChangePhoneVerifySerializer(serializers.Serializer):
    new_phone_number = serializers.CharField(max_length=20)
    otp = serializers.CharField(max_length=4)

class ClinicUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinic
        fields = ['clinic_name', 'clinic_phone_number', 'clinic_province', 'clinic_city', 'clinic_username', 'clinic_address']
        extra_kwargs = {
            'clinic_username': {'validators': []}
        }

class UserProfileSerializer(serializers.ModelSerializer):
    clinic = ClinicUpdateSerializer(required=False)
    
    class Meta:
        model = User
        fields = ['username', 'full_name', 'email', 'role', 'clinic' , 'phone_number']
        read_only_fields = ['role'] 

    def validate(self, attrs):
        user_id = self.instance.pk if self.instance else None
        
        fields_to_check = {
            'username': "Username already taken.",
            'email': "Email already registered."
        }
        for field, error_msg in fields_to_check.items():
            value = attrs.get(field)
            if value:
                query = User.objects.filter(**{field: value})
                if user_id:
                    query = query.exclude(pk=user_id)
                if query.exists():
                    raise serializers.ValidationError({field: error_msg})
        
        if 'clinic' in attrs and 'clinic_username' in attrs['clinic']:
            c_username = attrs['clinic']['clinic_username']
            clinic_query = Clinic.objects.filter(clinic_username=c_username)
            if self.instance.clinic:
                clinic_query = clinic_query.exclude(pk=self.instance.clinic.id)
            if clinic_query.exists():
                 raise serializers.ValidationError({"clinic": {"clinic_username": "Clinic username taken"}})

        if 'clinic' in attrs:
            if not self.instance.clinic or self.instance.clinic.owner != self.instance:
                raise serializers.ValidationError({"clinic": "You are not the owner of this clinic and cannot update it."})

        return attrs

    def update(self, instance, validated_data):
        clinic_data = validated_data.pop('clinic', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if clinic_data and instance.clinic:
            for attr, value in clinic_data.items():
                setattr(instance.clinic, attr, value)
            instance.clinic.save()

        return instance
    
from django.contrib.auth.hashers import check_password

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context.get('user')
        
        if not check_password(value, user.password):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate_new_password(self, value):
        if not PASSWORD_REGEX.match(value):
            raise serializers.ValidationError("Password is weak")
        return value

    def validate(self, attrs):
        if attrs['old_password'] == attrs['new_password']:
            raise serializers.ValidationError("New password cannot be the same as old password.")
        return attrs
