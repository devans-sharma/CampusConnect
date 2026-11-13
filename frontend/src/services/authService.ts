import api from './api';
import { User } from '../types';

export const authService = {
  async register(data: any) {
    const res = await api.post('/auth/register', data);
    return res.data.data as { user: User; token: string };
  },

  async login(credentials: { email: string; password: string }) {
    const res = await api.post('/auth/login', credentials);
    return res.data.data as { user: User; token: string };
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data.data as User;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
