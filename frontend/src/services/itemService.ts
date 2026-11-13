import api from './api';
import { Item, Category, PotentialMatch } from '../types';

export interface ItemQueryFilters {
  search?: string;
  itemType?: 'LOST' | 'FOUND';
  categoryId?: string;
  location?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

export const itemService = {
  async getItems(filters: ItemQueryFilters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.itemType) params.append('itemType', filters.itemType);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.location) params.append('location', filters.location);
    if (filters.status) params.append('status', filters.status);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const res = await api.get(`/items?${params.toString()}`);
    return res.data.data;
  },

  async getItemById(id: string) {
    const res = await api.get(`/items/${id}`);
    return res.data.data as {
      item: Item;
      similarItems: Item[];
      potentialMatches: PotentialMatch[];
    };
  },

  async createItem(formData: FormData) {
    const res = await api.post('/items', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data as {
      item: Item;
      potentialMatches: PotentialMatch[];
    };
  },

  async updateItem(id: string, data: Partial<Item>) {
    const res = await api.put(`/items/${id}`, data);
    return res.data.data as Item;
  },

  async deleteItem(id: string) {
    const res = await api.delete(`/items/${id}`);
    return res.data;
  },

  async updateStatus(id: string, status: string) {
    const res = await api.patch(`/items/${id}/status`, { status });
    return res.data.data as Item;
  },

  async getCategories() {
    const res = await api.get('/items/categories');
    return res.data.data as Category[];
  },

  async uploadImages(formData: FormData) {
    const res = await api.post('/items/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data as { urls: string[]; count: number };
  },
};
