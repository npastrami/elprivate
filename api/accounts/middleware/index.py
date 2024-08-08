from . import auth_jwt
from . import verify_signup

# You can organize it as a dictionary if you like
middleware = {
    "authJwt": auth_jwt,
    "verifySignUp": verify_signup
}