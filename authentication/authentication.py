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
    

