from quart import Blueprint, request, jsonify, redirect, url_for
from tortoise.exceptions import IntegrityError
from accounts.models.role_model import Role
from accounts.models.user_model import User
from passlib.hash import bcrypt
import jwt
from datetime import datetime, timedelta
from accounts.config.auth_config import SECRET_KEY
from accounts.controllers.gmail import send_email
from urllib.parse import urlencode

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

        # Generate token and send verification email
        verification_link = generate_verification_link(user.id)
        email_body = f"Please click the following link to verify your email address: {verification_link}"
        send_email(user.email, "Verify your email address", email_body)
        
        print("signup route finished")
        return jsonify({"message": "User was registered successfully! Please check your email to verify your account."}), 201
    except IntegrityError:
        return jsonify({"message": "Username or email already exists."}), 400
    
    

@auth_controller.route('/login', methods=['POST'])
async def signin():
    data = await request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = await User.get_or_none(username=username)
    if user and bcrypt.verify(password, user.password):
        if not user.email_verified:
            return jsonify({"message": "Please verify your email first."}), 403
        
        token = jwt.encode({
            'id': user.id,
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, SECRET_KEY, algorithm='HS256')

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
    
@auth_controller.route('/update', methods=['PUT'])
async def update_user():
    data = await request.get_json()
    user_id = data.get('id')
    new_username = data.get('username')
    new_email = data.get('email')
    new_password = data.get('password')

    user = await User.get_or_none(id=user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    changes_made = False

    # Check if username or email already exists for other users
    if new_username and new_username != user.username:
        if await User.filter(username=new_username).exclude(id=user_id).exists():
            return jsonify({"message": "Username already exists."}), 400
        user.username = new_username
        changes_made = True

    if new_email and new_email != user.email:
        if await User.filter(email=new_email).exclude(id=user_id).exists():
            return jsonify({"message": "Email already exists."}), 400
        user.email = new_email
        changes_made = True

    if new_password:
        user.password = bcrypt.hash(new_password)
        changes_made = True

    if changes_made:
        user.email_verified = False  # Set email_verified to False since there were changes
        await user.save()

        # Send verification email
        verification_link = generate_verification_link(user.id)
        email_body = f"Please click the following link to verify your updated email address: {verification_link}"
        send_email(user.email, "Verify your updated account details", email_body)

        return jsonify({"message": "User updated successfully. Please verify your updated details via the link sent to your email."}), 200
    else:
        return jsonify({"message": "No changes detected."}), 400
    
@auth_controller.route('/verify_email', methods=['GET'])
async def verify_email():
    print("in verify_email()")
    token = request.args.get('token')
    if not token:
        return jsonify({"message": "Token is missing"}), 400

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        user_id = payload['id']
        user = await User.get_or_none(id=user_id)
        if user:
            user.email_verified = True
            await user.save()
            return jsonify({"message": "Email verified successfully!"}), 200
        else:
            return jsonify({"message": "User not found"}), 404
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Verification token has expired"}), 400
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 400
    
def generate_verification_token(user_id):
    print("generating token")
    return jwt.encode({
        'id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=1)  # Token valid for 1 hour
    }, SECRET_KEY, algorithm='HS256')
    
def generate_verification_link(user_id):
    print("generating link")
    token = generate_verification_token(user_id)
    query_params = urlencode({'token': token})
    verification_link = f"http://localhost:8080/api/auth/verify_email?{query_params}"
    return verification_link