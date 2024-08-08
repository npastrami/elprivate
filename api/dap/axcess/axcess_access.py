from flask import Blueprint, request, jsonify
import requests
import base64

# Step 1: Encode ClientID and Client Secret
client_id = "your_client_id_here"
client_secret = "your_client_secret_here"
basic_auth_str = base64.b64encode(f"{client_id}:{client_secret}".encode('utf-8')).decode('utf-8')

# Step 2: Prepare the POST Request
token_endpoint = "https://login.cchaxcess.com/ps/auth/v1.0/core/connect/token"

headers = {
    'Authorization': f'Basic {basic_auth_str}',
    'Content-Type': 'application/x-www-form-urlencoded'
}

body = {
    'code': 'your_authorization_code_here',  # Replace with the actual authorization code
    'redirect_uri': 'your_redirect_uri_here',  # Must match the registered redirect URI
    'grant_type': 'authorization_code'
}

# Perform the POST request
response = requests.post(token_endpoint, headers=headers, data=body)

# Step 3: Interpret the Response
if response.status_code == 200:
    print("Successfully obtained tokens.")
    json_response = response.json()
    id_token = json_response['id_token']
    access_token = json_response['access_token']
    expires_in = json_response['expires_in']
    refresh_token = json_response['refresh_token']
    print(f"ID Token: {id_token}")
    print(f"Access Token: {access_token}")
    print(f"Expires In: {expires_in}")
    print(f"Refresh Token: {refresh_token}")
else:
    print(f"Failed to obtain tokens. Status code: {response.status_code}")
    print("Response Text:", response.text)