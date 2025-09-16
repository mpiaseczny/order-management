import { ajax } from '@lion/ajax';

const API_BASE = 'http://localhost:8080/api';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('jwt_token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  async register(userData) {
    try {
      const { response, body } = await ajax.fetchJson(`${API_BASE}/auth/register`, {
        method: 'POST',
        body: userData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      this.setAuthData(data);
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(credentials) {
    try {
      const { response, body } = await ajax.fetchJson(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: credentials,
      });

      if (!response.ok) {
        throw new Error(body.error || 'Login failed');
      }

      this.setAuthData(body);
      return body;
    } catch (error) {
      throw error;
    }
  }

  logout() {
    this.clearAuthData();
  }

  setAuthData(authResponse) {
    this.token = authResponse.token;
    this.user = {
      username: authResponse.username
    };

    localStorage.setItem('jwt_token', this.token);
    localStorage.setItem('user', JSON.stringify(this.user));
  }

  clearAuthData() {
    this.token = null;
    this.user = null;

    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.token;
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  getAuthHeaders() {
    if (!this.token) {
      return {};
    }

    return {
      'Authorization': `Bearer ${this.token}`,
    };
  }
}

export const authService = new AuthService();
