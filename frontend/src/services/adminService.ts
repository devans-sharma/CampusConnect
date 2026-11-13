import api from './api';
import { User, Item, Claim } from '../types';

export const adminService = {
  async getDashboard() {
    const res = await api.get('/admin/dashboard');
    return res.data.data;
  },

  async getUsers(params: { search?: string; role?: string; status?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const res = await api.get(`/admin/users?${query.toString()}`);
    return res.data.data as {
      users: User[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  },

  async toggleUserStatus(userId: string, status: 'ACTIVE' | 'SUSPENDED') {
    const res = await api.patch(`/admin/users/${userId}/status`, { status });
    return res.data.data as User;
  },

  async getAdminItems(params: { itemType?: string; status?: string; search?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.itemType) query.append('itemType', params.itemType);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const res = await api.get(`/admin/items?${query.toString()}`);
    return res.data.data as {
      items: Item[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },

  async getAdminClaims(params: { status?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const res = await api.get(`/admin/claims?${query.toString()}`);
    return res.data.data as {
      claims: Claim[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
  },
};
