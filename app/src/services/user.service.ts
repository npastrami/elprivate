import axios from 'axios';
import authHeader from './auth-header';

const API_URL = 'http://127.0.0.1:8080/api/test/';

class UserService {
  getPublicContent() {
    return axios.get(API_URL + 'all');
  }

  getUserBoard() {
    return axios.get(API_URL + 'user', { headers: authHeader() });
  }

  getModeratorBoard() {
    return axios.get(API_URL + 'mod', { headers: authHeader() });
  }

  getAdminBoard() {
    return axios.get(API_URL + 'admin', { headers: authHeader() });
  }
  
  getBoardByStatus(status: string) {
    switch (status) {
      case 'user':
        return this.getUserBoard();
      case 'mod':
        return this.getModeratorBoard();
      case 'admin':
        return this.getAdminBoard();
      default:
        return this.getPublicContent();
    }
  }
}

export default new UserService();
