from quart import Blueprint, jsonify

# Define a Blueprint for the user-related routes
user_controller = Blueprint('user_controller', __name__)

@user_controller.route('/all', methods=['GET'])
async def all_access():
    return jsonify({"message": "Public Content."}), 200

@user_controller.route('/user', methods=['GET'])
async def user_board():
    return jsonify({"message": "User Content."}), 200

@user_controller.route('/admin', methods=['GET'])
async def admin_board():
    return jsonify({"message": "Admin Content."}), 200

@user_controller.route('/moderator', methods=['GET'])
async def moderator_board():
    return jsonify({"message": "Moderator Content."}), 200