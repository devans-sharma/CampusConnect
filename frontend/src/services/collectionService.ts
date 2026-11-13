import api from './api';
import { Collection } from '../types';

export const collectionService = {
  async scheduleCollection(data: {
    claimId: string;
    collectionLocation: string;
    collectionInstructions: string;
    scheduledAt: string;
  }) {
    const res = await api.post('/collections/schedule', data);
    return res.data.data as Collection;
  },

  async confirmCollection(id: string, handoverNotes?: string) {
    const res = await api.patch(`/collections/${id}/confirm`, { handoverNotes });
    return res.data.data as Collection;
  },

  async getCollectionById(id: string) {
    const res = await api.get(`/collections/${id}`);
    return res.data.data as Collection;
  },
};
