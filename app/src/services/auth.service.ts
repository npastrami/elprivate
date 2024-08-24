import axios from "axios";

const API_URL = "http://127.0.0.1:8080/api/auth/";

class AuthService {
  login(username: string, password: string) {
    return axios
      .post(API_URL + "login", {
        username,
        password
      })
      .then(response => {
        if (response.data.accessToken) {
          localStorage.setItem("user", JSON.stringify(response.data));
        }

        return response.data;
      });
  }

  logout() {
    localStorage.removeItem("user");
  }

  register(username: string, email: string, password: string) {
    return axios.post(API_URL + "signup", {
      username,
      email,
      password
    });
  }

  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    if (userStr) return JSON.parse(userStr);

    return null;
  }
  // Add this method to handle forgot password
  forgotPassword(email: string) {
    return axios.post(API_URL + "forgot", { email });
  }

  // Add this method to handle resetting the password
  resetPassword(token: string | null, newPassword: string) {
    return axios.post(API_URL + "reset", { token, new_password: newPassword });
  }
}

const authService = new AuthService();
export default authService;
