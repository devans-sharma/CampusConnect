import api from './api';
import { Notification } from '../types';

export const notificationService = {
  async getNotifications() {
    const res = await api.get('/notifications');
    return res.data.data as { notifications: Notification[]; unreadCount: number };
  },

  async markAsRead(id: string) {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data.data as Notification;
  },

  async markAllAsRead() {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },
};
