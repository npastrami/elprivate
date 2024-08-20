from quart import Blueprint, request, jsonify
from accounts.middleware.verify_signup import check_duplicate_username_or_email, check_roles_existed
from accounts.controllers.auth_controller import signup, signin

# Define a Blueprint for the auth routes
auth_routes = Blueprint('auth_routes', __name__)

# Middleware to allow CORS for these routes
@auth_routes.before_request
async def before_request():
    if request.method == 'OPTIONS':
        # Assuming you're also allowing POST requests, then you might add other methods as needed
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'x-access-token, Origin, Content-Type, Accept',
        }
        return '', 204, headers
    # Else, for non-OPTIONS requests, you might want to set some headers too
    request.headers['Access-Control-Allow-Origin'] = '*'

@auth_routes.route('/api/auth/signup', methods=['POST'])
async def auth_signup():
    # Apply the verification middleware manually since Quart doesn't support middleware lists in route decorators
    duplicate_check = await check_duplicate_username_or_email(request)
    if duplicate_check:  # If the middleware returned a response, it means there was an error
        return duplicate_check
    roles_check = await check_roles_existed(request)
    if roles_check:  # Similarly, check if there was an error with role existence
        return roles_check
    # If all checks passed, proceed to the signup controller
    return await signup()

@auth_routes.route('/api/auth/login', methods=['POST'])
async def auth_signin():
    return await signin()
