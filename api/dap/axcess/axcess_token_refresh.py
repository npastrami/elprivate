import requests
import base64
import time
import threading

# Global variable to hold the current access token
current_access_token = None

# Function to make an API call
def make_api_call():
    global current_access_token  # Use the global access token
    if current_access_token is None:
        print("Access token is not yet available.")
        return

    api_endpoint = "https://some.cch.axcess.api/endpoint"  # Replace with the actual API endpoint
    headers = {
        'Authorization': f'Bearer {current_access_token}'
    }
    
    response = requests.get(api_endpoint, headers=headers)
    
    if response.status_code == 200:
        print("Successfully made API call.")
        print("Response Data:", response.json())
    else:
        print("Failed API call.")
        print("Status Code:", response.status_code)
        print("Response Text:", response.text)
        
# Function to refresh tokens
def refresh_tokens(refresh_token, client_id, client_secret, redirect_uri):
    global current_access_token
    while True:  # Infinite loop to keep refreshing
        # Encode ClientID and Client Secret
        basic_auth_str = base64.b64encode(f"{client_id}:{client_secret}".encode('utf-8')).decode('utf-8')
        
        # Prepare the POST Request
        token_endpoint = "https://login.cchaxcess.com/ps/auth/v1.0/core/connect/token"
        
        headers = {
            'Authorization': f'Basic {basic_auth_str}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        body = {
            'refresh_token': refresh_token,
            'redirect_uri': redirect_uri,
            'grant_type': 'refresh_token'
        }
        
        # Perform the POST request
        response = requests.post(token_endpoint, headers=headers, data=body)
        
        # Interpret the Response
        if response.status_code == 200:
            print("Successfully refreshed tokens.")
            json_response = response.json()
            new_access_token = json_response['access_token']
            new_refresh_token = json_response['refresh_token']
            
            # Update the global access token
            current_access_token = new_access_token

            # Update the refresh_token for the next cycle
            refresh_token = new_refresh_token

            # You can use the new tokens for subsequent API calls here
            make_api_call()

        else:
            print(f"Failed to refresh tokens. Status code: {response.status_code}")
            print("Response Text:", response.text)
        
        # Sleep for 105 minutes before the next refresh
        time.sleep(105 * 60)  # 105 minutes multiplied by 60 seconds

# Initial values (replace these with your actual values)
client_id = "your_client_id_here"
client_secret = "your_client_secret_here"
redirect_uri = "your_redirect_uri_here"
refresh_token = "your_initial_refresh_token_here"

# Start the refresh function in a separate thread
refresh_thread = threading.Thread(target=refresh_tokens, args=(refresh_token, client_id, client_secret, redirect_uri))
refresh_thread.daemon = True  # Set as a daemon thread so it will close when the main program closes
refresh_thread.start()