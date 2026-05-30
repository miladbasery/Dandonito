from .serializers import *
from .utils import save_otp, verify_otp_code, can_send_otp , get_tokens_for_user
from django.contrib.auth.hashers import check_password , make_password
from rest_framework.response import Response
from .authentication import authentication
from rest_framework.views import APIView
from rest_framework import status
from .models import User, Clinic
from django.db import transaction
from django.shortcuts import get_object_or_404




class RegisterRequestView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone_number']
            
            # if not can_send_otp(phone):
            #      return Response({"error": "Try again after 2 minutes"}, status=status.HTTP_400_BAD_REQUEST)
            
            request.session['register_data'] = serializer.validated_data
            
            otp_code = save_otp(phone)
            
            return Response({"message": "OTP sent", "code": otp_code}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegisterVerifyView(APIView):
    def post(self, request):
        serializer = RegisterVerifySerializer(data=request.data)
        
        if serializer.is_valid():
            validated_data = serializer.validated_data
            phone = validated_data['phone_number']
            code = validated_data['otp']
            
            print(f"Checking OTP for {phone} with code {code}")

            if not verify_otp_code(phone, code):
                print("OTP Invalid")
                return Response({"error": "code is invalid or expired"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                with transaction.atomic():
                    user = User.objects.create(
                        username=validated_data['username'],
                        password=make_password(validated_data['password']),
                        full_name=validated_data['full_name'],
                        phone_number=validated_data['phone_number'],
                        email = validated_data['email'],
                        role='DOCTOR' 
                    )

                    clinic = Clinic.objects.create(
                        clinic_name=validated_data['clinic_name'],
                        clinic_username=validated_data['clinic_username'],
                        clinic_phone_number = validated_data['clinic_phone_number'] , 
                        clinic_address="", 
                        clinic_province="", 
                        clinic_city="",
                        owner=user
                    )   
                    
                    user.clinic = clinic
                    user.save()

                tokens = get_tokens_for_user(user)
                
                return Response({
                    "message": "User and Clinic created successfully", 
                    "user_id": user.id, 
                    "tokens": tokens
                }, status=status.HTTP_201_CREATED)

            except Exception as e:
                print(f"Database Error: {e}")
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        print("Serializer Errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginRequestView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone_number']
            password = serializer.validated_data['password']
            
            try:
                user = User.objects.get(phone_number=phone)
            except User.DoesNotExist:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
            if not user.is_active:
                return Response({
                    "error": "Account deactivated",
                    "message": "Please call the administrator to activate your account"
                }, status=status.HTTP_403_FORBIDDEN)
            
            if not check_password(password, user.password):
                return Response({"error": "Wrong password"}, status=status.HTTP_400_BAD_REQUEST)
            
            if not can_send_otp(phone):
                return Response({"error": "Try again after 2 minutes"}, status=status.HTTP_400_BAD_REQUEST)
            
            otp_code = save_otp(phone)
            
            return Response({"message": "OTP sent", "code": otp_code}, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginVerifyView(APIView):
    def post(self, request):
        serializer = VerifyOtpSerializer(data=request.data)
        if serializer.is_valid():
            
            phone = serializer.validated_data['phone_number']
            code = serializer.validated_data['otp']

            if not verify_otp_code(phone, code):
                return Response({"error": "Invalid or expired OTP"}, status=status.HTTP_400_BAD_REQUEST)
            # session_phone = request.session.get('login_phone')
            # if not session_phone or session_phone != phone:
            #     return Response({"error": "Session invalid"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                user = User.objects.get(phone_number=phone)
                tokens = get_tokens_for_user(user)
                return Response({
                    "message": "Login successful", 
                    "user_id": user.id , 
                    "tokens": tokens
                }, status=status.HTTP_200_OK)
                
            except User.DoesNotExist:
                 return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class AssistantManagerView(APIView):
    def get(self, request):
        doctor = authentication(request, allowed_roles=['DOCTOR'])
        
        if not doctor.clinic:
            return Response([], status=status.HTTP_200_OK)
        users = User.objects.filter(clinic=doctor.clinic , is_active=True).exclude(id=doctor.id).order_by('-id')
        serializer = AssistantListSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        doctor = authentication(request, allowed_roles=['DOCTOR'])
        
        if not doctor.clinic:
            return Response({"error": "Clinic not found"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = CreateAssistantSerializer(data=request.data)
        
        if serializer.is_valid():
            validated_data = serializer.validated_data
            try:
                user = User.objects.create(
                    username=validated_data['username'],
                    password=make_password(validated_data['password']),
                    full_name=validated_data['full_name'],
                    phone_number=validated_data['phone_number'],
                    email=validated_data.get('email', ''),
                    role=validated_data.get('role', 'ASSISTANT'),
                    clinic=doctor.clinic
                )
                print("hello")
                return Response({
                    "message": "User created successfully",
                    "user_id": user.id
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AssistantDetailView(APIView):
    def get_object(self, pk, doctor):
        return get_object_or_404(User, pk=pk, clinic=doctor.clinic , is_active=True)
    
    def get(self, request, pk):
        doctor = authentication(request, allowed_roles=['DOCTOR'])
        user = self.get_object(pk, doctor)
        serializer = AssistantListSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        doctor = authentication(request, allowed_roles=['DOCTOR'])
        user = self.get_object(pk, doctor)
        
        serializer = UpdateAssistantSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        doctor = authentication(request, allowed_roles=['DOCTOR'])
        user = self.get_object(pk, doctor)
        
        if user.id == doctor.id:
             return Response({"error": "Cannot delete yourself"}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = False
        user.save()
        
        return Response({"message": "Deleted successfully"}, status=status.HTTP_200_OK)
    

class UserProfileView(APIView):
    def get(self, request):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if user.role != 'DOCTOR' and 'clinic' in data:
            data.pop('clinic')

        serializer = UserProfileSerializer(user, data=data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profile updated successfully", "data": serializer.data}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        
        user.is_active = False
        user.save()
        
        return Response({
            "message": "User deactivated successfully",
            "detail": "call the administrator to activate your account"
        }, status=status.HTTP_200_OK)

class RequestChangePhoneView(APIView):
    def post(self, request):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        serializer = ChangePhoneRequestSerializer(data=request.data)
        
        if serializer.is_valid():
            new_phone = serializer.validated_data['new_phone_number']
            
            # if not can_send_otp(new_phone):
            #      return Response({"error": "Wait 2 minutes"}, status=status.HTTP_400_BAD_REQUEST)
            
            code = save_otp(new_phone)
            return Response({"message": "OTP sent to new number", "code": code}, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyChangePhoneView(APIView):
    def post(self, request):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        serializer = ChangePhoneVerifySerializer(data=request.data)
        
        if serializer.is_valid():
            new_phone = serializer.validated_data['new_phone_number']
            code = serializer.validated_data['otp']
            
            if verify_otp_code(new_phone, code):
                user.phone_number = new_phone
                user.save()
                return Response({"message": "Phone number updated successfully"}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    
class ShowUserView(APIView):
    def get(self, request):
        users = User.objects.all()
        serializer = UserShowSerializer(users , many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class AssistantActivateView(APIView):
    def post(self, request, pk):
        doctor = authentication(request, allowed_roles=['DOCTOR'])
        user = get_object_or_404(User, pk=pk, clinic=doctor.clinic)
        
        if user.is_active:
             return Response({"message": "User is already active"}, status=status.HTTP_400_BAD_REQUEST)

        user.is_active = True
        user.save()
        
        return Response({"message": "User activated successfully"}, status=status.HTTP_200_OK)
    
class ChangePasswordView(APIView):
    def post(self, request):
        user = authentication(request, allowed_roles=['DOCTOR', 'ASSISTANT'])
        
        serializer = ChangePasswordSerializer(
            data=request.data, 
            context={'request': request, 'user': user} 
        )
        
        if serializer.is_valid():
            new_password = serializer.validated_data['new_password']
            user.password = make_password(new_password)
            user.save()
            print("password is changed : ", serializer.data , user.password)
            
            return Response(
                {"message": "Password changed successfully"}, 
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
