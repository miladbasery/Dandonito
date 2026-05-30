from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework.exceptions import AuthenticationFailed
from .models import User


def authentication(request, allowed_roles=['DOCTOR', 'doctor', 'ASSISTANT', 'assistant']):
    
    auth_header = request.headers.get('Authorization')


    if not auth_header:
        raise AuthenticationFailed('Authentication credentials were not provided.')

    parts = auth_header.split()

    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise AuthenticationFailed('Invalid authentication header. Format should be: Bearer <token>')

    token_str = parts[1]

    try : 
        token = AccessToken(token_str)

        user_id = token['user_id']

        user = User.objects.get(id=user_id)

        if not user.is_active:
            raise AuthenticationFailed('User is banned or inactive.')

        if user.role not in allowed_roles:
            raise AuthenticationFailed('You do not have permission to perform this action.')

        return user

    except (TokenError, InvalidToken):
        raise AuthenticationFailed('Token is invalid or expired.')
    
    except User.DoesNotExist:
        raise AuthenticationFailed('User not found.')
    

























# from rest_framework_simplejwt.authentication import JWTAuthentication
# from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed , TokenError
# from rest_framework_simplejwt.tokens import AccessToken
# from .models import User 

# class CustomUserJWTAuthentication(JWTAuthentication):
#     def get_user(self, validated_token):
#         try:
#             user_id = validated_token['user_id']
#         except KeyError:
#             raise InvalidToken(('Token contained no recognizable user identification'))

#         try:
#             user = User.objects.get(id=user_id)
#         except User.DoesNotExist:
#             raise AuthenticationFailed(('User not found'), code='user_not_found')

#         if not user.is_active:
#             raise AuthenticationFailed(('User is inactive'), code='user_inactive')

#         return user

# def HasRole(*allowed_roles):
#     class ManualTokenRoleCheck:
        
#         def has_permission(self, request, view):
#             auth_header = request.headers.get('Authorization')
            
#             if not auth_header or not auth_header.startswith('Bearer '):
#                 return False  
#             try:
#                 token_str = auth_header.split(' ')[1]
#             except IndexError:
#                 return False 

#             try:
#                 token = AccessToken(token_str)
#                 user_id = token['user_id']
#             except (TokenError, KeyError):
#                 return False  

#             try:
#                 user = User.objects.get(id=user_id)
                
#                 if not user.is_active:
#                     return False

#                 if user.role in allowed_roles:
#                     request.user = user 
#                     return True
                    
#             except User.DoesNotExist:
#                 return False 
#             return False

#     return ManualTokenRoleCheck


