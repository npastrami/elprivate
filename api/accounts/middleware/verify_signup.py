from quart import request, jsonify
from accounts.models.user_model import User  # Adjust the import path according to your project structure

ROLES = {"user", "admin", "moderator"}  # Example roles

async def check_duplicate_username_or_email(req):
    # Extract username and email from request body
    body = await req.get_json()
    username = body.get('username')
    email = body.get('email')

    # Check for duplicate username
    if await User.filter(username=username).exists():
        return jsonify({"message": "Failed! Username is already in use!"}), 400

    # Check for duplicate email
    if await User.filter(email=email).exists():
        return jsonify({"message": "Failed! Email is already in use!"}), 400

    return None

async def check_roles_existed(req):
    body = await req.get_json()
    roles = body.get('roles', [])
    
    # Check if all provided roles exist
    if any(role not in ROLES for role in roles):
        return jsonify({"message": "Failed! One or more roles do not exist."}), 400

    return None