from quart import Blueprint, jsonify, request
from accounts.middleware.auth_jwt import verify_token, role_required
from accounts.controllers.user_controller import all_access, user_board, moderator_board, admin_board

user_routes = Blueprint('user_routes', __name__)

# Middleware to allow CORS for these routes
@user_routes.before_request
async def before_request():
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'x-access-token, Origin, Content-Type, Accept',
        }
        return '', 204, headers
    request.headers['Access-Control-Allow-Origin'] = '*'

@user_routes.route('/api/test/all', methods=['GET'])
async def all_access_route():
    return await all_access()

@user_routes.route('/api/test/user', methods=['GET'])
@verify_token
async def user_board_route():
    return await user_board()

@user_routes.route('/api/test/mod', methods=['GET'])
@verify_token
@role_required('moderator')  # Assuming role_required is a decorator that checks for user roles
async def moderator_board_route():
    return await moderator_board()

@user_routes.route('/api/test/admin', methods=['GET'])
@verify_token
@role_required('admin')  # Assuming role_required is properly implemented
async def admin_board_route():
    return await admin_board()