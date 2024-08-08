import jwt
from quart import request, jsonify, current_app
from functools import wraps
from accounts.models.user_model import User  # Adjust the import path based on your project structure
from accounts.config.auth_config import SECRET_KEY  # Ensure this matches your actual config path

def verify_token(f):
    @wraps(f)
    async def decorated_function(*args, **kwargs):
        token = request.headers.get('x-access-token')
        if not token:
            return jsonify({"message": "No token provided!"}), 403
        try:
            decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user_id = decoded['id']
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid token!"}), 401

        return await f(*args, **kwargs)
    return decorated_function

async def check_role(user_id, role_name):
    user = await User.get(id=user_id)
    roles = await user.roles.all()
    for role in roles:
        if role.name == role_name:
            return True
    return False

async def is_admin(user_id):
    return await check_role(user_id, 'admin')

async def is_moderator(user_id):
    return await check_role(user_id, 'moderator')

def role_required(role):
    def decorator(f):
        @wraps(f)
        async def decorated_function(*args, **kwargs):
            user_id = request.user_id
            if role == 'admin' and not await is_admin(user_id):
                return jsonify({"message": "Require Admin Role!"}), 403
            elif role == 'moderator' and not await is_moderator(user_id):
                return jsonify({"message": "Require Moderator Role!"}), 403
            return await f(*args, **kwargs)
        return decorated_function
    return decorator